const express = require('express');
const router = express.Router();
const passport = require('passport');

function restInit(
  dbase, 
  readcfg, 
  createPassword,
)  {

  let cfg = readcfg(false)

  router.get('/getConfig', function(req, res) {    
    // console.log('/getConfig ->', req.body);
    cfg = readcfg(false)
    return res.json(cfg);
  });

  router.post('/createDocument', passport.authenticate('jwt', { session: false }), function(req, res) {
    (async () => {

      console.log('/createDocument ->', req.body);

      if (req.body.data.password)  req.body.data.password = await createPassword(req.body.data.password);

      dbase.createDocument({
        collection: req.body.collection,
        data: JSON.stringify(req.body.data),
      }, (err, resp) => {

        console.log(err, resp)

        if (resp)  return res.json(JSON.parse(resp.data))
        else return res.json([])
        
      });  

    })()
  });

  router.post('/readDocument', passport.authenticate('jwt', { session: false }), function(req, res) {
    console.log('/readDocument ->', req.body);

    let populate = null
    if (req.body.populate) populate = JSON.stringify(req.body.populate)

    let select = null
    if (req.body.select) select = JSON.stringify(req.body.select)

    dbase.readDocument({
      collection: req.body.collection,
      query: JSON.stringify(req.body.query),
      populate: populate,
      select: select,
    }, (err, resp) => {      
      
      console.log(err, resp)

      if (resp)  return res.json(JSON.parse(resp.data))
      else return res.json([])

    });      

  });
    
  router.post('/updateDocument', passport.authenticate('jwt', { session: false }), function(req, res) {
    (async () => { // 1. เพิ่ม async wrapper เพื่อให้ใช้ await ได้
      console.log('/updateDocument ->', req.body);

      // 2. เพิ่ม Logic ตรวจสอบและเข้ารหัสรหัสผ่าน
      if (req.body.collection === 'User') {
          // ถ้ามีรหัสผ่านส่งมา และไม่ใช่ค่าว่าง
          if (req.body.data.password && req.body.data.data !== '') {
              // (Optional) ป้องกันการ Hash ซ้ำ ถ้าค่าที่ส่งมาเป็น Hash อยู่แล้ว (ขึ้นต้นด้วย $2) จะไม่ทำอะไร
              // แต่ถ้าเป็นรหัสปกติ ให้ทำการ Hash
              if (!req.body.data.password.startsWith('$2')) {
                  req.body.data.password = await createPassword(req.body.data.password);
              }
          } else {
              // ถ้าส่งมาเป็นค่าว่าง (แปลว่าไม่ต้องการเปลี่ยนรหัส) ให้ลบ field password ออก
              // เพื่อไม่ให้ไปบันทึกค่าว่างทับรหัสเดิม
              delete req.body.data.password;
          }
      }

      dbase.updateDocument({
        collection: req.body.collection,
        query: JSON.stringify({ _id: req.body.data._id}),
        data: JSON.stringify(req.body.data),
      }, (err, resp) => {

        console.log(err, resp)

        if (resp)  return res.json(JSON.parse(resp.data))
        else return res.json([])

      });

    })() // เรียกใช้งาน async wrapper
  });
  // -------------------

  router.post('/deleteDocument', passport.authenticate('jwt', { session: false }), function(req, res) {
    console.log('/deleteDocument ->', req.body);

    dbase.deleteDocument({
      collection: req.body.collection,
      query: JSON.stringify(req.body.query),
    }, (err, resp) => {

      console.log(err, resp)

      if (resp)  return res.json(JSON.parse(resp.data))
      else return res.json([])

    });  

  });

  router.post('/dropDatabase', passport.authenticate('jwt', { session: false }), function(req, res) {
    console.log('/dropDatabase ->', req.body, );
    // await dropDatabase(req.body);
    dbase.dropDatabase(req.body, (err, resp) => {
      return res.json({ status: true });
    })
  });

  router.post('/dropCollection', passport.authenticate('jwt', { session: false }), function(req, res) {
    console.log('/dropCollection ->', req.body, );
    dbase.dropCollection(req.body, (err, resp) => {  // { baseName: temp[0].siteID, collection: 'devices' }
      return res.json({ status: true });
    });   
  });

}

module.exports = {
  restInit: restInit,
  router: router,
};