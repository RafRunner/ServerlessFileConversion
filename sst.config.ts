/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "sst-testes",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const inputBucket = new sst.aws.Bucket(`BucketConverteAudiosInputTeste`, {
      public: true,
    });

    const outputBucket = new sst.aws.Bucket(`BucketConverteAudiosOutputTeste`, {
      public: true,
    });

    const api = new sst.aws.ApiGatewayV2("ApiUploadAudiosTeste", {
      transform: {
        route: {
          handler: {
            timeout: "5 seconds",
          },
        },
      },
      accessLog: {
        retention: "3 months",
      },
    });

    api.route("GET /", {
      link: [inputBucket],
      handler: "src/api.uploadUrl",
      description: "Returns a signed URL the allows for the upload of files via a PUT request",
    });

    // It is not recommended to upload directly to a Lambda function, since it is more expensive (you pay for processing),
    // slower, and limited to 6 MB. You need to correctly supply Content-Type headers and it is sent in base64, which is
    // very inefficient. SST seems to have a bug, at least in dev mode, where big files result in a 500 error thrown in
    // library code. The main advantage of this is making validations before writing to s3.
    api.route("PUT /", {
      link: [inputBucket],
      handler: "src/api.upload",
      description: "Directly uploads a file",
    });

    api.route("GET /{id}", {
      link: [outputBucket],
      handler: "src/api.getById",
      description: "Redirects to a signed URL to download a file by id. If it doesn't exist, s3 will return a 404",
    });

    inputBucket.subscribe(
      {
        handler: "src/fileConversion.convertToWebm",
        link: [inputBucket, outputBucket],
        nodejs: {
          install: ["ffmpeg-static"],
        },
      },
      {
        events: ["s3:ObjectCreated:*"],
      }
    );
  },
});
