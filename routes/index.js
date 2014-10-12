var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

// -------- Our code from here ----------
var mongoose = require('mongoose');
var Post = mongoose.model('Post');          // load post model
var Comment = mongoose.model('Comment');    // load comment model

// ----------- REST Roates --------------
// Get all posts
router.get('/posts', function(req, res, next) {
	Post.find(function(err, posts) {
		if (err) { return next(err); }
		
		res.json(posts);
	});
});
// Create new post
router.post('/posts', function(req, res, next) {
	var post = new Post(req.body);
	
	post.save(function(err, post) {
		if(err) { return next(err); }
		
		res.json(post);
	});
});
// Map logic to route parameter 'post'
router.param('post', function(req, res, next, id) {
	var query = Post.findById(id);
	
	query.exec(function (err, post) {
		if (err) { return next(err); }
		if (!post) { return next(new Error("can't find post")); }
		
		req.post = post;
		return next();
	});
});
// Map logic to route parameter 'comment'
router.param('comment', function (req, res, next, id) {
	var query = Comment.findById(id);
	
	query.exec(function (err, comment) {
		if (err) { return next(err); }
		if (!comment) { return next(new Error("can't find comment")); }
		
		req.comment = comment;
		return next();
	});
});
// Get single post
router.get('/posts/:post', function(req, res) {
	req.post.populate('comments', function (err, post) {
		res.json(post);
	});
});
// Delete post
router.delete('/posts/:post', function(req, res) {
	req.post.comments.forEach(function(id) {
		Comment.remove({
			_id: id
		}, function(err) {
			if (err) { return next(err)}
		});
	})
	Post.remove({
		_id: req.params.post
	}, function(err, post) {
		if (err) { return next(err); }
		
		// get and return all the posts after you delete one
		Post.find(function(err, posts) {
			if (err) { return next(err); }
			
			res.json(posts);
		});
	});
});
// Upvote post
router.put('/posts/:post/upvote', function(req, res, next) {
	req.post.upvote(function(err, post) {
		if (err) { return next(err); }
		
		res.json(post);
	});
});
// Upvote comment
router.put('/posts/:post/comments/:comment/upvote', function (req, res, next) {
	req.comment.upvote(function (err, comment) {
		if (err) {
			return next(err);
		}
		
		res.json(comment);
	});
});
// Post comment
router.post('/posts/:post/comments', function(req, res, next) {
	var comment = new Comment(req.body);
	comment.post = req.post;
	comment.save(function(err, comment) {
		if (err) { return next(err); }
		
		req.post.comments.push(comment);
		req.post.save(function(err, post) {
			if (err) { return next(err); }
			
			res.json(comment);
		});
	});
});

module.exports = router;
