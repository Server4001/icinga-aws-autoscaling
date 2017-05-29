* These go in `/etc/nrpe.d`.
* Install nrpe via: `yum install -y nagios-plugins nagios-plugins-procs nagios-plugins-load nagios-plugins-disk nrpe`.
* Don't forget to add your icinga server host to `/etc/nagios/nrpe.cfg` and whitelist it to communicate with any nrpe servers on port `5666`.
