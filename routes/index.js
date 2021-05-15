const express 	= require('express');
const router 	= express.Router();

const passport 			= require('passport');
const GoogleStrategy 	= require('passport-google-oauth').OAuth2Strategy;
const googleCredentials = require('../config/google.json');

// DB 연결
const mongoose 	= require('mongoose');
const dbInfo 	= require('../config/mongodb.json');
mongoose.connect(dbInfo.connectInfo, { useNewUrlParser: true });

const { postModel } = require("./models/Post");



const check_user = function(req){
	// 비로그인 유저일때 (초기 접속 시 세션과 로그인 후 로그아웃 한 세션이 다름)
	if(req.session.passport === undefined || req.session.passport.user === undefined){
		console.log('로그인이 필요함');
		return false;
	} else {  // 로그인 되어 있을때
		return true;
	}
};

router.use(passport.initialize());
router.use(passport.session());



// root
router.get('/', function(req, res, next) {
	if(req.user){
		const name 		= req.user.displayName;
		const picture 	= req.user.photos[0].value;
		res.render('index', { name: name, picture: picture });
	} else {
		res.render('index', { name: '비로그인 유저', picture: '/images/user.png' });
	}
});

// 조회
router.get('/load', function(req, res, next) {
	postModel.find({}, function(err, data){
		res.json(data);
	});
});

// 글 등록
router.post('/write', function(req, res, next) {
	const author 	= req.body.author;
	const author_id = check_user(req) ? req.user.id : '';
	const picture 	= req.body.picture;
	const contents 	= req.body.contents;
	const date 		= Date.now();

	const post = new postModel();
	
	post.author 	= author;
	post.author_id 	= author_id;
	post.picture 	= picture;
	post.contents 	= contents;
	post.date 		= date;
	post.like 		= 0;
	post.comments 	= [];

	post.save(function (err) {
		if (err) {
			throw err;
		} else {
			res.json({status: "SUCCESS"});
		}
	});
});

// 좋아요 기능(증가)
router.post('/like', function(req, res, next) {
	const _id = req.body._id;

	postModel.findOne({_id: _id}, function(err, post) {
		if(err){
			throw err;
		} else {
			post.like++;
			
			post.save(function(err) {
				if(err){
					throw err;
				} else {
					res.json({status: "SUCCESS"});
				}
			});
		}
	});
});

// 글 삭제
router.post('/del', function(req, res, next) {
	const _id = req.body._id;
	const author_id = req.body.author_id;
	const user_id = check_user(req) ? req.user.id : '';
	
	console.log(author_id, user_id);
	if(author_id === user_id){
	   postModel.deleteOne({_id: _id}, function(err, result) {
			if(err){
				throw err;
			} else {
				res.json({status: "SUCCESS"});
			}
		});
	} else {
		console.log("글 작성자 만 삭제 가능합니다.");
		res.json({status: "FAIL"});
	}
});

// 글 수정
router.post('/modify', function(req, res, next) {
	const _id 		= req.body._id;
	const contents 	= req.body.contents;
	const author_id = req.body.author_id;
	const user_id 	= check_user(req) ? req.user.id : '';
	
	if(author_id === user_id){
		postModel.findOne({_id: _id}, function(err, post) {
			if(err){
				throw err;
			} else {
				post.contents = contents;
				post.save(function(err) {
					if(err){
						throw err;
					} else {
						res.json({status: "SUCCESS"});
					}
				});
			} 
		});
	} else {
		console.log("글 작성자 만 수정 가능합니다.");
		res.json({status: "FAIL"});
	}
});

// 댓글 기능
router.post('/comment', function(req, res, next) {
	const _id 		= req.body._id;
	const author 	= req.body.author;
	const comment	= req.body.comment;
	const date 		= Date.now();
	
	postModel.findOne({_id: _id}, function(err, post) {
		if(err){
			throw err;
		} else {
			post.comments.push({author: author, comment: comment, date: date});
			post.save(function(err) {
				if(err){
					throw err;
				} else {
					res.json({status: "SUCCESS"});
				}
			});
		}
	});
});

// 처음 로그인 시 세션에 저장
passport.serializeUser(function(user, done) {
	done(null, user);
});

// 이후 세선을 참고
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

passport.use(new GoogleStrategy({
		clientID: googleCredentials.web.client_id,
		clientSecret: googleCredentials.web.client_secret,
		callbackURL: "/auth/google/callback"
	}, 
	function(accessToken, refreshToken, profile, done) {
		process.nextTick(function(){	
			return done(null, profile);
		});
	}
));

router.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), 
		function(req, res) {
			res.redirect('/');
		}
);

router.get('/login', function(req, res, next) {
	// res.render('login');
	console.log('login 실패');
});

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

module.exports = router;