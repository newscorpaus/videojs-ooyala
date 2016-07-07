# videojs.ooyala.js

Video.js plugin to fetch videos from Ooyala. By supplying an Ooyala EmbedCode, the plugin will call the Ooyala API and fetch the video source of that EmbedCode.

## Demo

Run ```grunt``` on the project folder will serve up a server at ```localhost:3000/demo``` which provides a demo page.

## Usage

Include ```./dist/videojs.ooyala.js``` after video.js.

Enable the plugin once your player has been initialised:

```js
player.ooyala({
    playerBrandingId: (String), // Ooyala Player Branding ID (Required)
    pcode: (String),             // Ooyala Provider ID (Required)
    enableHls: (Boolean),        // Tweak force returning m3u8 from Ooyala if available (Optional)
    mobileProfile: (String)     // SAS profile to narrow down streams for mobile devices (Optional)
});
```

### Set an Ooyala video to the player:
If you want to set an Ooyala video to the player and prepare it for playback:

```js
player.ooyala.setSource(embedCode, callback);
// embedCode: (String) The Ooyala video EmbedCode (Required)
// callback: (Function) Returns the results of getVideoSource(), see below (Optional).
```

### Get video source from Ooyala
If you need to get the video source from ooyala for other use:

```js
player.ooyala.getVideoSource(embedCodes, callback);
// embedCodes: (String/Array) The Ooyala video EmbedCodes. Can be multiple videos. (Required)
// callback: (Function) Callback function once data is fetched. (Required)
```
Callback function will have `err` and `res` as argument, here is an example of callback results:

```javascript
{
    apiResponse: 'the complete response from the Ooyala API as a JSON object'
    videoUrls: {
        embedCode1: {
                authorized: 'true',         // If we are authorised to use this video
                src: 'Video URL',           // If authorised is true, this is defined.
                type: 'Video Type'          // If authorised is true, this is defined.
        },
        embedCode2: {
                authorized: 'false',
                message: 'Error Message',   // If authorised is false, this is defined.
                code: 'Error Code'          // If authorised is false, this is defined.
        }
    }
}
```
`src` and `type` are only set if `authorized` is true. You can then set these to the player, for example:

```js
player.ooyala.getVideoSource('myEmbedCode1, myEmbedCode2', function(err, res) {
    var videoResult = res && res['myEmbedCode1'];

    if (videoResult.authorized) {
      player.src({
          type: videoResult.type,
          src: videoResult.src
      });
    }
})
```

### Get the meta data of an Ooyala video
Ooyala videos have meta data that we can extract based on the embedCode.

```js
player.ooyala.getMetadata(embedCode, callback)
// embedCodes: (String/Array) The Ooyala video EmbedCodes. Can be multiple videos. (Required)
// callback: (Function) Callback function once metadata is fetched (Required)
```

Example:

```js
player.ooyala.getMetadata(embedCode, function(err, res) {
    console.log('metadata', embedCode, res);
})
```

## Player support

This plugin has been tested with:

- Video.Js 4.12.15
- Brightcove Perform Player v1.24.22

## IE Browser compatibility

This plugin uses the following functions so if you need support for a particular version of IE, you will need to implement a polyfill within your application.

| Function      | IE Version Supported  |
|-------------  |---------------------- |
| Object.keys   | IE9+                  |
| window.atob   | IE10+                 |

## Contributing

Bug fixes are always welcome, though for new functionality it's best to raise an issue first.
We appreciate that all contribution follow our style guide set in our JSHint and JSCS using  [Grunt](http://gruntjs.com/).

## History

### v0.3.0
* Retry XHR calls on timeout
* Add video.js error messages on failed XHR calls

### v0.2.0
* Add enableHls and mobileProfile option.
* Add prepareSettingSource() to allow developer to prepare video source before setting to video player.

### v0.1.0
* First release