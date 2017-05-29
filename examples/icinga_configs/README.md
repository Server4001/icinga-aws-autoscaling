* These configs can really go anywhere. I like to put them in places like:
    * `/etc/icinga2/host.groups.d`
    * `/etc/icinga2/commands.d`
* Just make sure to load them in via the `/etc/icinga2/icinga.conf` config file. EG:
```smarty
include_recursive "commands.d"
include "host.groups.d/*.conf"
```
* After changing you can syntax check with `service icinga2 checkconfig`, then reload with `service icinga2 reload`.
