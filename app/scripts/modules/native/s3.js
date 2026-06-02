AWS.config.region = 'us-west-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'YOUR_COGNITO_IDENTITY_POOL_ID',
}); // TODO: turn this into an API call and store values in cookie

function storeAdInS3(filename, data) {
  return $.when(fetchS3File(filename)).done(
    function(){
      console.log('File already exists');
    }).fail(
      function(){
        try {
          let bucket = 'YOUR_S3_BUCKET';
          uploadToS3(filename, data, bucket);
        } catch {
          console.log('Failed to upload ad to s3');
        }
      }
  )
}

function reportErrorS3(data, filename) {
  let jsonData = JSON.stringify(data);
  let upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: 'YOUR_ERRORS_BUCKET',
      Key: filename,
      Body: jsonData
    }
  })
  let promise = upload.promise();
  promise.then(
    function(data) {
      console.log(data);
    },
    function(err) {
      console.log(err);
    }
  )
}

function uploadToS3(filename, data, bucket) {
  let jsonData;
  if (typeof(data)==='string') {
    jsonData = data;
  } else {
    jsonData = JSON.stringify(data);
  }
  let upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: bucket,
      Key: filename,
      Body: jsonData
    }
  })
  let promise = upload.promise();
  promise.then(
    function(data) {
      console.log('Successfully upload data: '+ data);
    },
    function(err) {
      console.log(err);
    }
  )
}

async function fetchS3File(filename) {
  let parsedFilename = encodeURIComponent(filename);
  let url = 'https://YOUR_S3_BUCKET.s3-us-west-2.amazonaws.com/' + parsedFilename;
  return $.ajax({
    url: url,
    timeout: 5000,
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      return res
    },
    error: function (request, status, err) {
      if (status === 'timeout') {
        // timeout -> reload the page and try again
        console.log('Timeout triggered');
        // clearInterval(extractData);
        return null
      } else if (err.code === 403 || err === 'Forbidden') {
        console.log('403 - file doesn\'t exist');
        return '403'
      } else {
        // another error occured
        console.log('error: ' + request + status + err);
        return null
      }
    },
  });
}

export {fetchS3File, uploadToS3, storeAdInS3, reportErrorS3}