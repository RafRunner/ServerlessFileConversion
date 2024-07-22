/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    ApiUploadAudiosTeste: {
      type: "sst.aws.ApiGatewayV2"
      url: string
    }
    BucketConverteAudiosInputTeste: {
      name: string
      type: "sst.aws.Bucket"
    }
    BucketConverteAudiosOutputTeste: {
      name: string
      type: "sst.aws.Bucket"
    }
  }
}
export {}