function indexToLogin(){
	//Works
    console.log("jump");
    $(location).attr('href','login.html');
}

function login() {
	//Works
    let n = $('#luserName').val();
    let p = $('#lpassword').val();
    $.ajax({
    url: '/login/' + n +'/' + p +'/',
    method:'GET',
    success: function( result ) {
      if(result == 'There was an issue logging in. Please try again'){
		$('body').html(result);
      }else{
        $(location).attr('href','home.html');
      }
    }
    });
    
}

function addUser(){
	//Works
	let n = $('#userName').val();
    let p = $('#password').val();
    let t = $('#Type').val();
    let User = {username:n, password:p, type:t};
	let newUser_str = JSON.stringify(User);
	console.log(newUser_str);
	$.ajax({
	url:'/add/user/',
	data:{newUser:newUser_str},
	method:'POST',
	success: function(result){
		if(confirm(result)){
			window.location.reload();  
			}
		}
	});
}

function addCourse(){
	//Works
	let t = $('#TITLE').val();
    let dN = $('#DEPTNUM').val();
    let Course = {title:t,deptNum:dN};
	let newCourse_str = JSON.stringify(Course);
	console.log(newCourse_str);
	$.ajax({
	url:'/add/course/',
	data:{newCourse:newCourse_str},
	method:'POST',
	success: function(result){
		if(confirm(result)){
			$(location).attr('href','home.html');
			}
		}
	});
	return true;
}


