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
//        console.log("validate request: ", req);
//        console.log("validate reqeust, resp: ", res);
      }
    })
  });
}