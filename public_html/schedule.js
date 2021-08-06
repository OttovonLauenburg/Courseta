var CourseID = '';
function showSchedule(){
  $.ajax({
    url: '/get/schedule/',
    method:'GET',
    success: function(result) {
		courseList = result;
        innerHTML = '';
		for (let i in result){
			coID = result[i].deptNum
			courseDiv = "<button onclick='getChat(this.id)' class='courseButton' id='"+coID+"'>"+coID+" "+result[i].title+"</button>";
			innerHTML += courseDiv
		}
		$('#coursesList').html(innerHTML);
	}
	})
}
showSchedule();

function getChat(CourseId) {
	CourseID = CourseId;
	console.log(CourseID);
	$.ajax({
    url: '/get/chat/'+CourseId,
    method:'GET',
    success: function(result) {
		var discussHead = "<div><h1 class='contentTitle'>My Discuss</h1>";
		var chatHistory = "<div id='chat_history'>";
		var alias = result.ReqUser;
		for (let j in result.Chats){
		chatHistory += "<span class='alias_show'>"+result.Chats[j].user+": </span>"+"<span class='message_show'>"+result.Chats[j].message+"</span><br>";
		}
		chatHistory += "</div>";
		typing = "<div id='typing_area'><label for='message'>"+alias+" </label><input id='message' type='text'><button id='send' onclick='sendMessage()'>send</button></div>";
		InnerHtml = discussHead+chatHistory + typing;
		$('.contentStyle').html(InnerHtml);
    }
    });
}


function sendMessage(){
	var Message = $('#message').val();
    $.ajax({
    url: '/add/message/'+CourseID,
    method:'POST',
	data:{message:Message},
    success: function(result) {
		getChat(CourseID);
    }
    });
}

function search(){
	if ($('.form-control').val() == ''){
		$('.contentStyle').html("<h1 class='contentTitle'>Enter Something!</h1>");
	}else{
		$.ajax({
		url: '/search/course/'+$('.form-control').val(),
		method:'GET',
		success: function(result) {
			if (result !== "No Result!"){
				innerhtml = "<h1 class='contentTitle'>Search Result</h1>";
				//var resultHead = "<h1 class='contentTitle'>Search Result</h1>";
				result = JSON.parse(result).sresult;
				for (let k in result){
				console.log(result[k]);
				courseDiv = "<div class='courseButton cDiv'>"+result[k].deptNum+" "+result[k].title+"<button class='addButton' onclick='joinCourse(this.id)' id='"+result[k].deptNum+"'>Add</button></div>";
				innerhtml += courseDiv;
				}
				$('.contentStyle').html(innerhtml);
			}else{
				$('.contentStyle').html("<h1 class='contentTitle'>"+result+"</h1>");
			}
		}
		});
	}
}


function joinCourse(COURID){
	console.log(COURID);
	$.ajax({
    url: '/join/course/'+ COURID,
    method:'POST',
    success: function(result) {
		if(confirm(result)){
			window.location.reload();  
		}
	}
	})
}



