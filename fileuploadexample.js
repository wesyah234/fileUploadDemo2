Uploads = new Mongo.Collection('uploads');

if (Meteor.isClient) {
  Meteor.subscribe('uploads');
  Template.fileList.helpers({
    theUploads: function () {
      return Uploads.find({}, {sort: {"name": 1}});
    },
    myCallbacks: function () {
      return {
        finished: function (index, fileInfo, context) {
          console.log('This function will execute after each fileupload is finished on the client');
          console.log("index ", index);
          console.log("fileInfo ", fileInfo);
          console.log("context ", context);
        }

      }
    },
    someStuff: function () {
      // this is data that will be passed to the server with the upload
      return {someData: "hello", otherData: "goodbye"}
    }
  });
  Template.fileList.events({
    'click #deleteFileButton ': function (event) {
      Meteor.call('deleteFile', this._id);
    }
  })

}
;

if (Meteor.isServer) {
  Meteor.publish("uploads", function () {
    console.log("publishing files");
    var uploads = Uploads.find({});
    console.log("returning " + uploads.fetch().length + " uploads");
    return uploads;
  });

  Meteor.methods({
    'deleteFile': function (_id) {
      check(_id, String);

      var upload = Uploads.findOne(_id);
      if (upload == null) {
        throw new Meteor.Error(404, 'Upload not found'); // maybe some other code
      }
// NOTE: we should also validate here and make sure user is logged in by passing a token through
      UploadServer.delete(upload.path);
      Uploads.remove(_id);
    }
  })

  Meteor.startup(function () {
    UploadServer.init({
      tmpDir: process.env.PWD + '/Uploads/tmp',
      uploadDir: process.env.PWD + '/Uploads/',
      checkCreateDirectories: true,
      finished: function (fileInfo, formFields) {
        console.log("upload finished, fileInfo ", fileInfo);
        console.log("upload finished, formFields: ", formFields);
        Uploads.insert(fileInfo);
      },
      cacheTime: 100,
      mimeTypes: {
        "xml": "application/xml",
        "vcf": "text/x-vcard"
      },
      validateRequest: function (req, res) {
        // to validate, one way to do it would be to form your download urls on the client to pass in some token
        // that we can use to look up the current user by the token
        //console.log("token passed in: ", req.query.token);
        // possibly hit the users collection to see if the token is valid by looking at the hashed resume tokens
        //var user = Users.findOne({"services.resume.loginTokens":{$elemMatch:{"hashedToken":req.query.token}}});
        //console.log("user ", user);
        //if you want to allow the download, return nothing
        //// if you want to prevent the download, return a string with the error message, like:
        //return "cannot download this file,, sorry";
      }
    })
  });
}