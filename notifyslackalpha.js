var Slack = require('slack-node');
var fs = require('fs');
var path = require('path');
var Newman = require('newman');
var request = require('unirest');

var slackChannel = '{channelID}';
var postmanCollectionUrl = '{postman collectionUrl}'
var apiToken = '{apiToken}';

slack = new Slack(apiToken);


/*
Parsing the testresultsfile to a Slack Attachment.
Needs real itteration to work with multiple collections
*/
function getSlackMessageAttachment(postmanResult) {
    var slackAttachments = [];
    var testResults = postmanResult.results[0].tests;
    try {

        for (var key in testResults) {
            slackAttachments.push({
                "fallback": "Error",
                "title": key,
                "color": (testResults[key] ? "#0F0" : "#F00")
            });
        }
        console.log(slackAttachments);
        return slackAttachments;
    } catch (error) {

    }
}

newmanOptions = {
    iterationCount: 1,                    // define the number of times the runner should run
    outputFile: "testresults.json",            // the file to export to
    responseHandler: "TestResponseHandler", // the response handler to use
    asLibrary: true,                        // this makes sure the exit code is returned as an argument to the callback function
    stopOnError: true
}

request.get(postmanCollectionUrl).type('json').end(function(data) {
    if (data.error) {
        Errors.terminateWithError('Unable to fetch a valid response. Error: ' + data.code);
    }
    Newman.execute(data.body, newmanOptions, function(result) {
        var postmanLog = JSON.parse(fs.readFileSync('testresults.json'));
        slack.api('chat.postMessage', {
            text: '*Newman API-testresult for:* ' + "`" + postmanLog.collection.name + '`' + "\n" +
            "*Timestamp:* " + new Date(postmanLog.collection.timestamp) + "\n" +
            "*Remote test ink:* " + postmanLog.collection.remoteLink + "\n" +
            "*Api-Endpoint* " + postmanLog.collection.requests[0].url,
            title: '',
            as_user: true, //Post as yourself
            //username: "{BotName}",
            attachments: JSON.stringify(getSlackMessageAttachment(postmanLog)),
            channel: slackChannel,
            mrkdwn: true
        }, function(err, response) {
            //Handle slack response and errors
        });
    });
})





