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
      public: true
    })

    const api = new sst.aws.ApiGatewayV2("ApiUploadAudiosTeste", {
      transform: {
        route: {
          handler: {
            timeout: "5 seconds"
          }
        }
      },
      accessLog: {
        retention: "3 months"
      }
    });

    // Returns a signed URL the allows for the upload of files via a PUT request
    api.route("GET /", {
      link: [inputBucket],
      handler: "src/api.uploadUrl",
    });

    // Directly uploads a file
    api.route("PUT /", {
      link: [inputBucket],
      handler: "src/api.upload",
    });

    // Redirects to a signed URL to download a file by id. If it doesn't exist, s3 will return a 404
    api.route("GET /{id}", {
      link: [inputBucket],
      handler: "src/api.getById",
    });
  },
});
