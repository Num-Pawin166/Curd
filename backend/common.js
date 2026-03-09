const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const bcrypt = require('bcryptjs');

let fs = require('fs')
let cfg = null

function sleep(delay = 0) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

function readcfg (flag)  {
  let resp = {}
  if (fs.existsSync('../config/config.js'))  resp = fs.readFileSync('../config/config.js', 'utf8',)
  if (fs.existsSync('../config.js'))  resp = fs.readFileSync('../config.js', 'utf8',)
  if (fs.existsSync('./config.js'))  resp = fs.readFileSync('./config.js', 'utf8',)
      // console.log('resp ->', resp)
  const json = eval(resp)
  cfg = json
  if (flag)  console.log('config ->', json)
  return json
}

function grpcInit ()  {

  let dbase = null

  const cfg = readcfg(false)

  const packageDefinition = protoLoader.loadSync(
    "proto/db.proto",
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    }
  );
  const dbaseproject = grpc.loadPackageDefinition(packageDefinition).dbaseproject;
  dbase = new dbaseproject.DbaseProject(
    cfg.dbaseIP+':'+cfg.dbasePort, 
    grpc.credentials.createInsecure(), 
    {'grpc.max_send_message_length': 50*1024*1024, 'grpc.max_receive_message_length': 50*1024*1024}
  );
  
  return({
    dbase: dbase,
  })

}

function isDbReady(dbase) {
  return new Promise(resolve => {
    dbase.dbIsReady({}, (err, resp) => {
      resolve(resp)
    });
  });
}

function createPassword (password)  {
  return new Promise(resolve => {
    bcrypt.genSalt(10, (err, salt) => {
      if(err) console.error('There was an error', err);
      else {
        bcrypt.hash(password, salt, (err, hash) => {
          if(err) console.error('There was an error', err);
          else {
            // console.log('hash =>', hash);
          }
          resolve(hash);
        });
      }
    });
  });    
}

module.exports = {
  sleep: sleep,
  readcfg: readcfg,
  grpcInit: grpcInit,
  isDbReady: isDbReady,
  createPassword: createPassword,
}
