const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

const opts = {};
opts.jwtFromRequest = ExtractJWT.fromAuthHeaderAsBearerToken();

module.exports = (
  passport, 
  dbase,
  privateKey,  
) => {

  // opts.secretOrKey = 'secret';
  opts.secretOrKey = privateKey;

  passport.use(new JWTStrategy(opts, (jwt_payload, cb) => {
    console.log('passport ->', jwt_payload.userName, )
    dbase.readDocument({ 
      collection: 'User',
      query: JSON.stringify({ userName: jwt_payload.userName, }),
    }, (err, resp) => {

      let user = null

      if (resp)  {
        
        let temp = JSON.parse(resp.data)
        if (temp.length)  user = temp[0]

        if (user)  {
          return cb(null, user);
        }
        else  {
          return cb(null, {
            text: 'Users token error!',
          });
        }

      }
      else  {
        console.log('\x1b[31m%s\x1b[0m', 'passport -> Users database connection error!');
        return cb(null, {
          text: 'Users database connection error!',
        });
      }

/*       if (resp && resp.collection != 'error')  user = JSON.parse(resp.data)
      // console.log('Passport ->', user);

      if (err)  {
        console.log('\x1b[31m%s\x1b[0m', 'passport -> Users database connection error!');
        return cb(null, {
          text: 'Users database connection error!',
        });
        // return cb(null, null)
      }
      else  {
        if (user.userName == '')  {
          return cb(null, {
            text: 'Users token error!',
          });
          // return cb(null, null)
        }
        else  {
          user.text = null;
          return cb(null, user);
        }
      } */

    })
  }));
}