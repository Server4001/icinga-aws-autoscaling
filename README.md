# icinga-aws-autoscaling

## Management of dynamic AWS Auto-Scaling Group inventory in Icinga.

### TODO:

* Instructions on setting up SNS topic, Lambda function, etc.
* Dynamic `vars.os`. Maybe lookup base AMI?
* Dynamic host-groups based on tags.
* Group hosts by ASG name.
* Example host-group and service templates for NRPE.
* Move AWS SDK to dev dependencies, as Lambda includes it.
* Deploy script.
* Overrides using environment vars.
