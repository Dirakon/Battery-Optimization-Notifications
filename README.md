# Battery optimization notifications

Based on [this script](https://gitlab.com/gitaarik/battery-health-notifications/)

# Run

Do `npm run start`

Select folder. Bash script and data file will appear there

Do (replacing `{SCRIPT_PATH}.sh` with bash script path)

```bash
crontab -l > mycrontab
echo "*/1 * * * * /bin/bash {SCRIPT_PATH}.sh" >> mycrontab
crontab mycrontab
rm -f mycrontab
```