const send=(res,status,data)=>{
 res.statusCode=status;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.end(JSON.stringify(data));
};

export default function handler(_req,res){
 return send(res,409,{error:'Yayındaki site salt okunur katalog olarak çalışıyor. Yeni ders ve notlar bu cihazda saklanır; Cihazlar ekranından yedekleyebilirsin.'});
}
