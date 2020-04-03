
const jwt = require('express-jwt');

const getTokenFromHeaders = (req) => {
  console.log("getTokenFromHeaders");
  console.log(req.headers);
  let token = req.header('authorization');

  console.log(token);
  if(token && token.split(' ')[0] === 'Bearer') {
    return token.split(' ')[1];
  }
  return null;

  // const { headers: { authorization } } = req;
  // console.log(authorization);
  // if(authorization && authorization.split(' ')[0] === 'Token') {
  //   return authorization.split(' ')[1];
  // }
  // return null;
};

const auth = {
  required: jwt({
    secret: 'secret',
    userProperty: 'payload',
    getToken: getTokenFromHeaders,
  }),
  optional: jwt({
    secret: 'secret',
    userProperty: 'payload',
    getToken: getTokenFromHeaders,
    credentialsRequired: false,
  }),
};

module.exports = auth;