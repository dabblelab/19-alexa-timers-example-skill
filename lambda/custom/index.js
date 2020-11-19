const Alexa = require('ask-sdk-core');
const axios = require('axios');
const moment = require("moment");

const timerItem = {
    "duration": "PT15S",
    "timerLabel": "demo",
    "creationBehavior": {
        "displayExperience": {
            "visibility": "VISIBLE"
        }
    },
    "triggeringBehavior": {
        "operation": {
            "type": "ANNOUNCE",
            "textToAnnounce": [
                {
                    "locale": "en-US",
                    "text": "This ends your timer."
                }
            ]
        },
        "notificationConfig": {
            "playAudible": true
        }
    }
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
            || (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'TimerStartIntent'));
    },
    handle(handlerInput) {

        const { permissions } = handlerInput.requestEnvelope.context.System.user;

        if (!permissions) {

            handlerInput.responseBuilder
                .speak("This skill needs permission to access your timers.")
                .addDirective({
                    type: "Connections.SendRequest",
                    name: "AskFor",
                    payload: {
                        "@type": "AskForPermissionsConsentRequest",
                        "@version": "1",
                        "permissionScope": "alexa::alerts:timers:skill:readwrite"
                    },
                    token: ""
                });

        } else {
            handlerInput.responseBuilder
                .speak("would you like to set a timer?")
                .reprompt("would you like to set a timer?")
        }

        return handlerInput.responseBuilder
            .getResponse();

    }
};

const ConnectionsResponsetHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Connections.Response';
    },
    handle(handlerInput) {
        const { permissions } = handlerInput.requestEnvelope.context.System.user;

        //console.log(JSON.stringify(handlerInput.requestEnvelope));
        //console.log(handlerInput.requestEnvelope.request.payload.status);

        const status = handlerInput.requestEnvelope.request.payload.status;


        if (!permissions) {
            return handlerInput.responseBuilder
                .speak("I didn't hear your answer. This skill requires your permission.")
                .addDirective({
                    type: "Connections.SendRequest",
                    name: "AskFor",
                    payload: {
                        "@type": "AskForPermissionsConsentRequest",
                        "@version": "1",
                        "permissionScope": "alexa::alerts:timers:skill:readwrite"
                    },
                    token: "user-id-could-go-here"
                })
                .getResponse();
        }

        switch (status) {
            case "ACCEPTED":
                handlerInput.responseBuilder
                    .speak("Now that we have permission to set a timer. Would you like to start?")
                    .reprompt('would you like to start?')
                break;
            case "DENIED":
                handlerInput.responseBuilder
                    .speak("Without permissions, I can't set a timer. So I guess that's goodbye.");
                break;
            case "NOT_ANSWERED":

                break;
            default:
                handlerInput.responseBuilder
                    .speak("Now that we have permission to set a timer. Would you like to start?")
                    .reprompt('would you like to start?');
        }

        return handlerInput.responseBuilder
            .getResponse();
    }
};

const YesNoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
    },
    async handle(handlerInput) {

        //handle 'yes' utterance
        if (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent') {

            const duration = moment.duration(timerItem.duration),
                hours = (duration.hours() > 0) ? `${duration.hours()} ${(duration.hours() === 1) ? "hour" : "hours"},` : "",
                minutes = (duration.minutes() > 0) ? `${duration.minutes()} ${(duration.minutes() === 1) ? "minute" : "minutes"} ` : "",
                seconds = (duration.seconds() > 0) ? `${duration.seconds()} ${(duration.seconds() === 1) ? "second" : "seconds"}` : "";

            const options = {
                headers: {
                    "Authorization": `Bearer ${Alexa.getApiAccessToken(handlerInput.requestEnvelope)}`,
                    "Content-Type": "application/json"
                }
            };

            const apiEndpoint = getApiEndpoint(Alexa.getLocale(handlerInput.requestEnvelope));

            await axios.post(apiEndpoint, timerItem, options)
                .then(response => {
                    handlerInput.responseBuilder
                        .speak(`Your ${timerItem.timerLabel} timer is set for ${hours} ${minutes} ${seconds}.`);
                })
                .catch(error => {
                    console.log(error);
                });
        }

        //handle 'no' utterance
        if (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent') {
            handlerInput.responseBuilder
                .speak('Alright I didn\'t start a timer.');
        }

        return handlerInput.responseBuilder
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say set a timer.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        console.log(`handlerInput.requestEnvelope: ${handlerInput.requestEnvelope}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

function getApiEndpoint(locale) {

    //North America – https://api.amazonalexa.com
    //Europe – https://api.eu.amazonalexa.com
    //Far East – https://api.fe.amazonalexa.com

    const naEndpoint = "https://api.amazonalexa.com/v1/alerts/timers",
          euEndpoint = "https://api.eu.amazonalexa.com/v1/alerts/timers",
          feEndpoint = "https://api.fe.amazonalexa.com/v1/alerts/timers";

    let apiEndpoint = naEndpoint;

    switch (locale) {
        case "de-DE":
            apiEndpoint = euEndpoint;
            break;
        case "en-AU":
            apiEndpoint = feEndpoint;
            break;
        case "en-CA":
            apiEndpoint = naEndpoint
            break;
        case "en-GB":
            apiEndpoint = euEndpoint;
            break;
        case "en-IN":
            apiEndpoint = euEndpoint;
            break;
        case "en-US":
            apiEndpoint = naEndpoint;
            break;
        case "es-MX":
            apiEndpoint = naEndpoint
            break;
        case "es-US":
            apiEndpoint = naEndpoint;
            break;
        case "fr-CA":
            apiEndpoint = naEndpoint;
            break;
        case "fr-FR":
            apiEndpoint = euEndpoint;
            break;
        case "hi-IN":
            apiEndpoint = feEndpoint;
            break;
        case "it-IT":
            apiEndpoint = euEndpoint;
            break;
        case "ja-JP":
            apiEndpoint = feEndpoint;
            break;
        case "pt-BR" :
            apiEndpoint = naEndpoint;
            break;
    }

    return apiEndpoint;
}

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        ConnectionsResponsetHandler,
        YesNoIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler,
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
