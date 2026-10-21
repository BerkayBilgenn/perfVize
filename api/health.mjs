const send=(res,status,data)=>{
 res.statusCode=status;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.end(JSON.stringify(data));
};

export default function handler(_req,res){
 return send(res,200,{app:'perfuzyon',version:3,mode:'static',readOnly:true});
}
