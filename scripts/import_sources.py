"""One-time, non-destructive import of the user's retrieved course material."""
import json, hashlib, shutil, re, zipfile, subprocess, posixpath, logging
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
import xml.etree.ElementTree as ET
from pypdf import PdfReader

logging.getLogger('pypdf').setLevel(logging.ERROR)
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data/lessons'; ASSETS=ROOT/'assets'; DATA.mkdir(parents=True,exist_ok=True)
STAMP=datetime.now(timezone.utc).isoformat()
THREADS=json.loads((ROOT/'sources/threads.json').read_text())
NS={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
JOBS=[]; SEEN={}; REPORT={'files':[],'duplicates':[],'unavailable':[],'importedAt':STAMP,'scannedPages':0}
RENDER=Path('/Users/kberkaybilgenn/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm')

def save(d):
    p=DATA/(d['id']+'.json')
    if p.exists():
        old=json.loads(p.read_text())
        for k in ['favorite','completed','personalNotes','createdAt']: d[k]=old.get(k,d.get(k))
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2))

def base(id,title,category,kind='document',order=100):
    return dict(id=id,title=title,category=category,kind=kind,order=order,tags=[],sections=[],attachments=[],favorite=False,completed=False,personalNotes='',createdAt=STAMP,updatedAt=STAMP)

def blob(data,ext):
    name=hashlib.sha256(data).hexdigest()[:24]+ext.lower()
    p=ASSETS/'media'/name;p.parent.mkdir(parents=True,exist_ok=True)
    if not p.exists():p.write_bytes(data)
    return '/assets/media/'+name

def render(pdf,folder):
    result=subprocess.run([str(RENDER),'-jpeg','-jpegopt','quality=80','-scale-to','1400',str(pdf),str(folder/'page')],capture_output=True)
    if result.returncode:print('RENDER ERROR',pdf.name,result.stderr.decode()[:200],flush=True)

def title_for(path,category):
    name=path.name
    if 'mediasten' in name:return 'Mediasten anatomisi','Anatomi',1
    if 'kalp ve damar' in name:return 'Kalp ve damar anatomisi','Anatomi',2
    if 'mitral' in name:return 'Mitral kapak hastalıkları ve cerrahisi','Kalp cerrahisi',3
    if 'Gorsel_Ogrenme' in name:return 'Perfüzyon · Görsel öğrenme rehberi','Perfüzyon',4
    if '7_Gunluk' in name:return '7 günlük çalışma planı','Çalışma planı',30
    if '1_Sinif' in name:return '1. sınıf · Perfüzyon teknikleri','Perfüzyon',5
    m=re.search(r'St-(\d+)',name)
    if m:return 'Sterilizasyon ve cerrahi asepsi · Sunum '+m[1],'Sterilizasyon',10+int(m[1])
    if path.suffix.lower()=='.pdf':
        m=re.search(r'([1-5])[_. ]*hafta',name,re.I)
        if m:return 'Kardiyak anestezi · '+m[1]+'. hafta'+(' (ek kaynak)' if '2.Hafta' in name else ''),'Kardiyak anestezi',20+int(m[1])
        if name=='1.Hafta 4.pdf':return 'Kardiyak anestezi · 1. hafta','Kardiyak anestezi',21
    return path.stem,category,50

def import_file(path,thread=None,category='Perfüzyon'):
    path=Path(path)
    if not path.exists(): REPORT['unavailable'].append({'name':path.name,'reason':'Dosyaya erişilemedi.'});return
    raw=path.read_bytes();digest=hashlib.sha256(raw).hexdigest()
    if digest in SEEN:REPORT['duplicates'].append({'name':path.name,'sameAs':SEEN[digest]});return
    SEEN[digest]=path.name
    if path.suffix.lower()=='.zip':
        folder=ROOT/'sources/extracted'/digest[:12];folder.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(path) as z:
            for name in z.namelist():
                if Path(name).suffix.lower() not in ['.pdf','.pptx']:continue
                target=folder/Path(name).name;target.write_bytes(z.read(name));import_file(target,thread,category)
        return
    id='doc-'+digest[:16];folder=ASSETS/id;folder.mkdir(parents=True,exist_ok=True)
    original=folder/('original'+path.suffix.lower());shutil.copyfile(path,original)
    title,category,order=title_for(path,category);d=base(id,title,category,order=order)
    d['sourceName']=path.name;d['attachments']=[{'name':path.name,'url':'/assets/'+id+'/'+original.name}]
    if thread:d['sourceUrl']='https://chatgpt.com/c/'+thread
    if path.suffix.lower()=='.pdf':
        reader=PdfReader(path);count=len(reader.pages);digits=len(str(count))
        for i,page in enumerate(reader.pages,1):
            text=(page.extract_text()or'').strip()
            if len(text)<40: REPORT['scannedPages']+=1
            d['sections'].append({'title':'Sayfa '+str(i),'text':text,'images':[{'url':f'/assets/{id}/page-{i:0{digits}d}.jpg','alt':f'{title} · Sayfa {i}'}]})
        d['scanned']=all(len(s['text'])<40 for s in d['sections']);d['tags']=['PDF',str(count)+' sayfa']
        JOBS.append((original,folder))
    elif path.suffix.lower()=='.pptx':
        with zipfile.ZipFile(path) as z:
            rels={x.attrib['Id']:x.attrib['Target'] for x in ET.fromstring(z.read('ppt/_rels/presentation.xml.rels'))}
            pres=ET.fromstring(z.read('ppt/presentation.xml'))
            slides=[posixpath.normpath('ppt/'+rels[x.attrib['{'+NS['r']+'}id']]) for x in pres.findall('.//p:sldId',NS)]
            for i,name in enumerate(slides,1):
                xml=ET.fromstring(z.read(name));paras=[''.join(t.text or '' for t in p.findall('.//a:t',NS)) for p in xml.findall('.//a:p',NS)]
                paras=[t.strip() for t in paras if t.strip()]
                text='\n'.join(paras)
                images=[]
                relname=posixpath.dirname(name)+'/_rels/'+posixpath.basename(name)+'.rels'
                if relname in z.namelist():
                    sr={x.attrib['Id']:x.attrib for x in ET.fromstring(z.read(relname))}
                    for blip in xml.findall('.//a:blip',NS):
                        rel=sr.get(blip.attrib.get('{'+NS['r']+'}embed'))
                        if not rel or rel.get('TargetMode')=='External':continue
                        target=posixpath.normpath(posixpath.join(posixpath.dirname(name),rel['Target']))
                        ext=Path(target).suffix.lower()
                        if target in z.namelist() and ext in ['.jpg','.jpeg','.png','.gif','.webp']:
                            url=blob(z.read(target),ext)
                            if not any(img['url']==url for img in images):images.append({'url':url,'alt':f'{title} · Slayt {i} görseli'})
                heading=next((t for t in paras if len(t)>4 and not t.startswith('Bölümün Adı')),f'Slayt {i}')[:140]
                d['sections'].append({'title':f'{i}. '+heading,'text':text,'images':images})
            d['tags']=['PPTX',str(len(slides))+' slayt']
    else:return
    save(d);REPORT['files'].append({'name':path.name,'title':title,'id':id,'sections':len(d['sections']),'images':sum(len(s['images']) for s in d['sections']),'sha256':digest})
    print('IMPORTED',title,len(d['sections']),flush=True)

for t in THREADS:
    for a in t.get('attachments',[]): import_file(a['path'],t['thread']['id'])
    for turn in t.get('turns',[]):
        for item in turn.get('items',[]):
            if item.get('type')=='agentMessage' and ('chatgpt-content-reference' in item.get('text','') or 'sandbox:' in item.get('text','')):
                REPORT['unavailable'].append({'thread':t['thread']['title'],'url':'https://chatgpt.com/c/'+t['thread']['id'],'reason':'Önceki yanıtın veya üretilen dosyanın tamamı erişim aracıyla alınamadı.'});break
    sections=[]
    for turn in reversed(t.get('turns',[])):
        for item in turn.get('items',[]):
            text=item.get('text','')
            if item.get('type')=='agentMessage' and len(text)>120 and not text.startswith('::chatgpt-content-reference'):
                text=re.sub(r'::?chatgpt-content-reference\{[^}]*\}','',text)
                text=re.sub(r'\[([^\]]+)\]\(sandbox:[^)]+\)',r'\1 (özgün dosya erişilemiyor)',text)
                if len(text.strip())>150:sections.append({'title':'Sohbet notu','text':text+('\n\n[Bu yanıt kaynakta kısaltılmış olarak alındı.]' if item.get('truncated') else ''),'images':[]})
    if sections:
        d=base('chat-'+t['thread']['id'],t['thread']['title'],'Sohbet notları',kind='conversation',order=40);d['sections']=sections;d['sourceUrl']='https://chatgpt.com/c/'+t['thread']['id'];d['tags']=['Sohbet'];save(d)

for p in Path('/Users/kberkaybilgenn/Downloads').glob('*Perfu*.pdf'):import_file(p)

# Preserve the prior local revision bank as a separate collection, without rewriting its content.
legacy=Path('/Users/kberkaybilgenn/Documents/Codex/2026-10-08/https-github-com-berkaybilgenn-perf-zyon-3/work/Perf-zyon/site/data')
categories={'PER241':'Anatomi','PER243':'Kardiyak anestezi','PER245':'Perfüzyon','PER247':'Sterilizasyon','PER207':'ECMO','PER141':'Perfüzyon temelleri'}
REPORT['revisionCards']=0
for path in legacy.glob('*.json'):
    raw=json.loads(path.read_text());topics={}
    for c in raw:topics.setdefault(c.get('topic','Genel'),[]).append(c)
    backup=ROOT/'sources/previous-question-bank';backup.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,backup/path.name)
    for topic,cards in topics.items():
        id='review-'+hashlib.sha256((path.stem+topic).encode()).hexdigest()[:16];d=base(id,topic,categories.get(path.stem,'Tekrar'),'revision',order=100)
        d['course']=path.stem;d['tags']=[path.stem,'Tekrar arşivi'];d['cards']=cards;d['sourceName']='Önceki yerel Perf-zyon çalışması · '+path.stem
        for c in cards:
            text='\n'.join(str(c[k]) for k in ['en','definition','body','origin'] if c.get(k))
            if c['type']=='compare':text='\n\n'.join(v.get('title','')+'\n'+'\n'.join(v.get('points',[])) for v in [c.get('left',{}),c.get('right',{})])
            d['sections'].append({'title':c.get('term')or c.get('title')or c.get('question')or c.get('statement')or 'Tekrar','text':text,'images':[],'card':c})
        REPORT['revisionCards']+=len(cards);save(d)

print('RENDERING',len(JOBS),'PDFs',flush=True)
with ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(lambda args:render(*args),JOBS))
REPORT['unavailable']=list({(x.get('thread'),x.get('name')):x for x in REPORT['unavailable']}.values())
REPORT['conversations']=[{'title':t['thread']['title'],'url':'https://chatgpt.com/c/'+t['thread']['id']} for t in THREADS]
(ROOT/'sources/report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2))
print('DONE',len(REPORT['files']),'files;',REPORT['revisionCards'],'revision cards;',REPORT['scannedPages'],'scanned pages',flush=True)
