var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
var session = require('express-session');
var token = require('../app/com/token.js');

var log = require('./com/log.js');

var mongoose = require('mongoose');
global.dbHandel = require('./database/dbHandel');
// v3.4.5 mongodb
// global.db = mongoose.connect("mongodb://mongo.duapp.com:8908/cNYxkVbkVlHNxGIQfmje",
//   {user : "fdf172d6419d42799d02f5d8df0edd95",pass : "da8558d465044ee4bd65d88dee13d72f",auth : {authMechanism: 'SCRAM-SHA-1'}},
//   function (err,data){
//     log({err: err ? err : 'mongoDB连接成功!'});
//   });
global.db = mongoose.connect("mongodb://mongo.duapp.com:8908/cNYxkVbkVlHNxGIQfmje",
  {user : "fdf172d6419d42799d02f5d8df0edd95",pass : "da8558d465044ee4bd65d88dee13d72f"},
  function (err,data){
    log({err: err ? err : 'mongoDB连接成功!'});
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secret',
    cookie:{
        maxAge: 1000*60*30,
    }
}));

app.use(function(req,res,next){
    res.locals.user = req.session.user;   // 从session 获取 user对象

    var err = req.session.error;   //获取错误信息
    delete req.session.error;
    res.locals.message = "";   // 展示的信息 message
    if(err){
        res.locals.message = '<div class="alert alert-danger" style="margin-bottom:20px;color:red;">'+err+'</div>';
    }
    next();  //中间件传递
});

// token 验证
app.use(function(req,res,next){
    var _token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies.token;
    var path = req.originalUrl;
    req.session._render = req.session._render || {
        istoken: false
    };
    if(!_token || !token.checkToken(_token)){
        req.session._render.istoken = false;
        // token 验证失败 只能访问登录注册
        // if ((path != "/login") && (path != "/register")) {
        //     res.redirect("/login");
        // }else{
        // }
        next();  //中间件传递
    }else{
        req.session._render.istoken = true;
        next();  //中间件传递
    }
});

// 路由
app.use('/', index);
// app.use('/users', users);
app.use('/login', index);
app.use('/register', index);
app.use('/editPwd', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
