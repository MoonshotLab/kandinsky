const express = require('express');
const router = express.Router();
const validator = require('validator');
const fs = require('fs');
const path = require('path');

const db = require('./../lib/db');
const util = require('./../lib/util');

router.post('/', function(req, res) {
  console.log('received a text-message request for e-mail');

  const emailAddress = util.extractEmailFromString(req.body.Body);

  if (
    emailAddress !== null &&
    emailAddress.length > 0 &&
    validator.isEmail(emailAddress)
  ) {
    const phoneNumber = req.body.From.replace('+', '');

    db
      .findRecordByPhoneNumber(phoneNumber)
      .then(function(record) {
        // check to see if the file exists, if not download it from S3
        // then e-mail it
        if (record) {
          const file = path.join(process.cwd(), 'tmp', record.s3Id + '.mp4');
          fs.stat(file, function(err, stat) {
            console.log(
              'found record, downloading and emailing to',
              emailAddress
            );
            if (err) {
              util.asyncDownloadFilesFromS3(record.s3Id).then(function(stream) {
                util.sendEmail(emailAddress, stream);
              });
            } else {
              util.sendEmail(emailAddress, file);
            }
          });
        } else {
          console.log(
            'could not find a matching record for phone number:',
            phoneNumber
          );
        }
      })
      .catch(console.log);
  }

  res.send('');
});

module.exports = router;
