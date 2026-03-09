const port = 3300;

module.exports = {
    server: true,  // true or false
    protocal: 'http',  // http or https
    productName: 'CRUD',
    baseName: 'CRUD',
    serverPort: port,
    dbasePort: port+1,    
    dbaseIP: 'localhost',
    dbaseURL: 'mongodb://127.0.0.1:27017/',

    // corsOrigin: [
    //     "http://localhost:3000", // dev mode
    //     "http://localhost:3300", // dev mode
    // ],
}
