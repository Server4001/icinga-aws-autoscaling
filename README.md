# icinga-aws-autoscaling

## Dynamic management of AWS Auto-Scaling Group inventory in Icinga.

### Purpose

The purpose of this package is to dynamically add and remove hosts in Icinga 2, where the hosts correspond to servers in an AWS Auto-Scaling Group.

Out of the box, no Icinga 2 config changes are necessary, though it can be useful to add configs that assign host-groups and services based on host vars.

### Preparing the code for AWS Lambda
* Copy `./config.json.example` to `./config.json`. Replace the settings inside with those applicable to your setup.
    * See the "Config values" section below for more details.
* Run: `rm -rf node_modules && npm install --production`
* Build the Lambda ZIP by running: `npm run build`
    * This will produce a zip file in the `./build` folder for you to upload to AWS Lambda.

### Config values
* `icinga_host`, `icinga_port`, `icinga_user`, and `icinga_pass` are all required.
* `icinga_host_name_property` - Optional, defaults to "instance_id". Determines what to set the name of the host to in Icinga. One of: "instance_id", "public_dns", "public_ip", "private_dns", or "private_ip".
* `icinga_host_vars` - Optional. Set to an object where each key is the host var `vars.KEY`, and each value is the host var's value.
    * EG: `"icinga_host_vars": {"os": "Linux"}` would set `vars.os` to "Linux".
    * This is useful for dynamically assigning host groups (see ./examples/icinga_configs/host_group.conf).

### AWS Setup

#### Creating the SNS Topic
* Enter a topic name and display name.
* This is how we will feed Auto-Scaling Group scale events into our Lambda function.

#### Creating the Lambda Function
* Create a new Lambda function, using the "Blank Function" blueprint.
* For the trigger, choose "SNS", then choose the SNS topic created earlier.
* You do not need to enable the trigger yet.
* Enter a name and description for the function, then choose a runtime of "Node.js 6.10".
* For the Lambda function code, choose "Upload a .ZIP file", then select the zip of this repo that we created earlier.
* For the "function handler", enter `lambda.handler`
* For the "function role", you will need to create a new IAM role. Choose "Create a custom role".
    * This will open a new window where you can create a new IAM role.
    * Enter an appropriate Role Name.
    * Edit the Policy Document so that it contains JSON below. It is a combination of the `AWSLambdaBasicExecutionRole` and `AmazonEC2ReadOnlyAccess` roles.
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "ec2:Describe*",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "elasticloadbalancing:Describe*",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:ListMetrics",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:Describe*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "autoscaling:Describe*",
      "Resource": "*"
    }
  ]
}
```
* Add any tags you need, and change any of the advanced settings you would like to.
    * I have found the default memory and timeout of 128mb and 3sec work fine.
* Click the Create Function button to finish this step.
* You should enable this Lambda Function BEFORE you configure your Auto-Scaling Group to publish to the SNS Topic.

#### Configuring your Auto-Scaling Group to publish to the SNS Topic
* Go to your ASG, and open the "Notifications" tab.
* Create a new notification.
* Select "use existing topic", and select the SNS Topic we created earlier.
* Select the "Launch" and "Terminate" events. This code does not yet support the other event types ("fail to launch" and "fail to terminate").
* Save the new notification.
* You should now be able to scale your ASG, and see instances added/removed in Icinga 2.

### Troubleshooting
* The first place to look is the logs for the Lambda Function.
    * Go to Cloudwatch => Logs. Choose the log group for your Lambda Function.
    * If you do not see any Node.js errors, there is not much I can help with. Check your config, check your security groups, etc.
    * If you DO see Node.js errors, it is likely they are related to the requests sent to Icinga 2. Read them and determine if you have a config or security group issue.
* If you find issues with the code in this repo, please create an issue in GitHub.

### Running code locally
* Install all dependencies using: `rm -rf ./node_modules && npm install`
* Make sure you have AWS credentials set using a credentials file, environment variables, etc.
    * See the [AWS SDK for JavaScript documentation](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html) for more information.
* Open a Node.js REPL using: `node`
* You can simulate an ASG Launch/Terminate event using the following code. If everything is set up correctly, you should see hosts added/removed in Icinga.
```js
const lambda = require('./lambda');
const callback = (result) => { if (result !== null) { console.log(result); } };
const instanceId = 'i-1234567890abcdef1';
const az = 'us-west-2b';

const launchEvent = {Records: [{Sns: {Message: `{"Event": "autoscaling:EC2_INSTANCE_LAUNCH", "Details": {"Availability Zone": "${az}"}, "EC2InstanceId": "${instanceId}"}`}}]};
lambda.handler(launchEvent, {}, callback);

const terminateEvent = {Records: [{Sns: {Message: `{"Event": "autoscaling:EC2_INSTANCE_TERMINATE", "Details": {"Availability Zone": "${az}"}, "EC2InstanceId": "${instanceId}"}`}}]};
lambda.handler(terminateEvent, {}, callback);
```
* Don't forget to replace the Availability Zone and EC2 Instance ID.

### Running tests
* Run tests: `npm run test`
* Run tests w/ coverage: `npm run test:coverage`
    * See: `./test.tap` and `./coverage/lcov-report/index.html`

### TODO

* Screenshots of AWS setup.
* Add full event payload to fixtures.
