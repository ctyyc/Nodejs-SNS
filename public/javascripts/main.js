let timer 	= null;
let editing = false;

const load = function() {
	if(!editing){
		$.get('/load', function (data) {
			$("#wall").empty();
			$(data).each(function (idx) {
				const id = this._id;
				const authorId = this.author_id;
				
				$("#wall").prepend("<div class='item'> <div class='left'></div><div class='right'></div></div>");
				
				$("#wall .item:first .left").append("<img class='photo_thumb' src='" + this.picture + "'/>");
				$("#wall .item:first .left").append("<input type='hidden' id='author_id' value='" + this.author_id + "'/>");
				$("#wall .item:first .right").append("<div class='author'><b>" + this.author + "</b> (" + this.date + ")&nbsp;&nbsp; <span class='text_button modify'>수정</span> <span class='text_button del'>삭제</span> <span class='text_button like'>좋아요</span></div>");
				$("#wall .item:first .right").append("<div class='contents " + id + "'>" + this.contents + "</div>");
				$("#wall .item:first .right").append("<div class='likes'>LIKE : " + this.like + "</div>");
				$("#wall .item:first .right").append("<div class='comments'></div>");
				
				$(this.comments).each(function (j) {
					$("#wall .item:first .right .comments").append("<div class='comment_item'>" + this.author + ": " + this.comment + "</div>");
				});
				
				$("#wall .item:first .comments").append("<input class='input_comment' type='text' placeholder='댓글을 입력하세요.' />");
				
				$("#wall .item:first .input_comment").on("focus", function() {
					editing = true;
				});
				
				$("#wall .item:first .input_comment").on("blur", function() {
					editing = false;
				});
				
				$("#wall .item:first .input_comment").keypress(function(evt){
					if((evt.keyCode || evt.which) == 13){
						if (this.value !== "") {
							comment(this.value, id);
							evt.preventDefault();
							$(this).val("");
							editing = false;
						}
					}
				});
				
				let chk = true;
				
				$("#wall .item:first .modify").click(function(evt) {
					editing = true;
					if(chk){
						const contents = $("#wall ." + id).html();
						$("#wall ." + id).html("<textarea id='textarea_" + id + "' class='textarea_modify'>" + contents + "</textarea>");
						chk = false;
					}
					$("#textarea_" + id).keypress(function(evt) {
						if((evt.keyCode || evt.which) == 13){
							if(this.value !== "") {
								modify(this.value, id, authorId);
								evt.preventDefault();
								editing = false;
							}
						}
					});
					
				});
				
				$("#wall .item:first .del").click(function(evt) {
					del(id, authorId);
				});
					
				$("#wall .item:first .like").click(function(evt) {
					editing = false;
					like(id);
				});
				
			});
		});		  
    }
};
		
const write = function(contents) {
	const postdata = {
		'author' : $("#author").val(),
		'contents' : contents,
		'picture' : $("#message").find(".photo").attr('src')
	};
	
	$.post('/write', postdata, function() {
		load();
	});
};

const modify = function(contents, id, authorId) {
	const postdata = {
		'author' : $("#author").val(),
		'author_id' : authorId,
		'contents' : contents,
		'_id' : id
	};
	
	$.post('/modify', postdata, function(msg) {
		if(msg.status === 'FAIL') {
			alert("글 작성자 만 수정 가능합니다.");
		}
		load();
	});
};

const comment = function(comment, id) {
	const postdata = {
		'author' : $("#author").val(),
		'comment' : comment,
		'_id' : id
	};
	
	$.post('/comment', postdata, function() {
		load();
	});
};

const del = function(id, authorId) {
	const postdata = {
		'_id' : id,
		'author_id' : authorId
	};
	
	$.post('/del', postdata, function(msg) {
		if(msg.status === 'FAIL') {
			alert("글 작성자 만 삭제 가능합니다.");
		}
		load();
	});
};

const like = function(id) {
	const postdata = {
		'_id' : id
	};
	
	$.post('/like', postdata, function() {
		load();
	});
};

$(document).ready(function (){
	$("#message textarea").on("focus", function() {
		editing = true;
	});

	$("#message textarea").on("blur", function() {
		editing = false;
	});	
	
	$("#message textarea").keypress(function(evt) {
		if((evt.keyCode || evt.which) == 13){
			if(this.value !== ""){
				write(this.value);
				evt.preventDefault();
				$(this).val("");
				editing = false;
			}
		}
	});
	
	$("#write_button").click(function(evt) {
		write($("#message textarea").val());
		$("#message textarea").val("");
		editing = false;
	});
	
	load();
	timer = setInterval(load(), 5000);
});		  