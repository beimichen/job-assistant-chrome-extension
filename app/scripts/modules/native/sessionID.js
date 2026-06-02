// import {Cookies} from 'js-cookie'

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function saveSessionID(){
  let sessionID = uuidv4();
  Cookies.set('session_id', sessionID);
  window.sessionID = sessionID;
}

function saveUserID(){
  let _userID = Cookies.get('user_id');
  if (!_userID) {
    let userID = uuidv4();
    Cookies.set('user_id', userID);
    window.sessionID = sessionID;
  }
}

function fetchSessionID(){
  return Cookies.get('session_id');
}

function removeSessionID(){
  Cookies.remove('session_id');
}

export {saveSessionID, fetchSessionID, removeSessionID, saveUserID}