# KILT boilerplate

This repo intends to create and run a working boilerplate for logging in using KILT credentials.

## Index

1. [Create secrets through distillery](#step1)
2. [Add Sporran extension and import credential](#step2)
3. [Run NextJS project](#step3)

## Steps

### <a name="step1"></a>1. Create secrets through distillery

- Run the following commands:
```bash
cd 02-kilt-distillery-cli
yarn
yarn start
```
- This will prompt a series of questions:
- select `create project from recipe`
- select `NextJS Credential Login`
- Enter the `dapp's name` (e.g. `my_app`)
- Enter the JWT exp time (e.g. `1 day`)
- Answer `yes` to the question `auto renew the JWT?`
- Select `peregrine testnet`
- Select `generate a new mnemonic`
- Answer `http://localhost:3000` to the question `enter origin`
- Follow the instructions: visit the faucet link and request tokens, then wait for the distillery to automatically fetch the availability
- Select `yes` to the question `Create a test Claimer w/Credential?`
- Follow the instructions: visit the faucet link and request tokens, then wait for the distillery to automatically fetch the availability
- Now the distillery starts creating and self-attesting credentials. Since we only need email credential, leave empty fields for any other credential type (Github, Twitch, Twitter, Discord) and fill only the email one
- Finally, press any key to continue and then select `exit`.
- Now there should be two folders inside the `02-kilt-distillery-cli` folder: `my_app` and `claimer-credentials`.

### <a name="step2"></a>2. Add Sporran Extension and import credential

The following instructions comes from [this link](https://hackmd.io/@dTGKTsAWSxi6eYV5aeFnXA/BkzbzlBu5) (section `Sporran Wallet (5 min)`).
- Run the following commands:
```bash
cd ../03-sporran-extension
yarn install && yarn dev
```
<details><summary>Chrome</summary>
<ul>
<li>Visit <code>chrome://extensions</code></li>
<li>At the top-right corner, click on <code>Developer mode</code> to enable it</li>
<li>At the top-left corner, click on <code>Load unpacked</code></li>
<li>Select the <code>./sporran-extension/dist</code> folder</li>
</ul>
</details>

<details><summary>Firefox</summary>
<ul>
<li>Visit <code>about:debugging#/runtime/this-firefox</code></li>
<li>Click on <code>Load Temporary Add-on...</code></li>
<li>Select the file <code>./03-sporran-extension/dist/manifest.json</code></li>
</ul>
</details>

- Be sure that `Custom endpoint` has the value `wss://peregrine.kilt.io/parachain-public-ws`
- In the Sporran extension, click on `Import an Identity from pre-existing phrase`
- Insert the 12-words mnemonic in the `./02-kilt-distillery-cli/claimer-credentials/.env` file, assigned to `CLAIMER_MNEMONIC`
- Click on `Next` and set your local password
- Once this is done, click on `Show credentials` and then `Import credentials`. Select the file `./02-kilt-distillery-cli/claimer-credentials/peregrine email.json`.


### <a name="step3"></a>3. Run NextJS project

- Now run the following commands:
```bash
cd ../04-nextjs-sporran-credential-login
yarn
```
- Move the file `./02-kilt-distillery-cli/my_app/.env` into `./04-nextjs-sporran-credential-login`
- Inside the `04-nextjs-sporran-credential-login` folder, run `yarn run dev`
- Create a folder `.well-known` inside the `public` folder
- On your browser, visit `http://localhost:3000/api/wellKnownDidConfig`
- Copy the entire JSON and paste into a new file `did-configuration.json` inside the `.well-known` folder
- Stop and run again the `yarn run dev` command
- Visit `localhost:3000`
- On the top-right corner, click on `Connect`: this will pop-up the extension. Click on `Yes, allow this application access`
- The `Connect` button has changed to `login`: click on it. This will pop-up the extension again: select the email credential and click `Next`. Enter your local password

You're done! You succesfully logged in using KILT. You can verify you have access by clicking `GO TO SECRET PAGE`  or `GET SECRET MESSAGE`. 
