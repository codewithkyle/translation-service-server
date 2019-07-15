interface IServer{
    listen: (port:number, response:Function)=>void;
    get: Function;
}

interface IExpress{
    get: (req:any, res:any)=>void;
    listen: (port:number)=>void;
    use: Function;
}

interface IExpressRequest{

}

interface IExpressResponse{
    send: Function;
    sendFile: Function;
}