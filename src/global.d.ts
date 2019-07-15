interface IServer{
    listen: (port:number, response:Function)=>void;
    get: Function;
}

interface IExpress{
    get: Function;
    post: Function;
    listen: (port:number)=>void;
    use: Function;
}

interface IExpressRequest{
    file: IFile;
}

interface IExpressResponse{
    send: Function;
    sendFile: Function;
    status: (status:number)=>any;
}

interface IFile{
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}