const mongoose = require('mongoose');

const Post = mongoose.Schema({
	author: String,
	author_id : String,
	picture: String,
	contents: String,
	date: Date,
	like: Number
});

const postModel = mongoose.model('Post', Post);

module.exports = { postModel };