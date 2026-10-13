# Temporary puzzle hosting

This stack hosts only the games, using a private S3 bucket and a CloudFront HTTPS distribution with origin access control. It needs no new IAM role, database, Lambda, OpenAI key, or login. The game page and its answer files are public through CloudFront: use generic puzzle content only. These are casual browser games, not a secure contest; answers can be inspected in browser tools. Progress stays in browser storage. Shared results contain colored squares, not answers.

AWS resources incur usage charges and remain until teardown. There is no automatic expiry. Published links stop working after teardown, so keep the stack up while people play. CloudFront creation and deletion can take several minutes. No AWS resources are created just by running the local editor.

In **The extras → The weekly brain break**, generate and review puzzles, then export the JSON. Enter a word theme and four Connections themes for OpenAI generation, or use “Surprise me (generic)” for the curated bank without an AI call. The public game host needs no API key. Changing an answer changes the edition ID, preserving older emailed puzzle editions. Editing a puzzle clears the published URL until you publish again. The five-letter game currently accepts any five letters, without a dictionary check.

Use an explicit profile, region, and expected account ID. Example placeholders below must be replaced; do not paste AWS credentials into chat or this repo.

```sh
node scripts/games-cloud.mjs validate --profile YOUR_PROFILE --region us-east-1 --account YOUR_ACCOUNT_ID --stack weekly-wins-games-pilot
node scripts/games-cloud.mjs deploy --profile YOUR_PROFILE --region us-east-1 --account YOUR_ACCOUNT_ID --stack weekly-wins-games-pilot --puzzle /absolute/path/to/exported-puzzle.json
```

The script checks the account and stack ownership before mutations and uploads only the four game assets and edition JSON. It does not upload the newsletter editor, wins, images, .env, or source tree. It prints the published edition URL. Open that URL to verify both games, then paste it into **Published game URL** in the editor. The email includes a teaser and a browser link, without scripts or puzzle answers. Without a published HTTPS URL the preview card is excluded from Gmail copy.

Publish another reviewed edition while keeping the same stack:

```sh
node scripts/games-cloud.mjs publish --profile YOUR_PROFILE --region us-east-1 --account YOUR_ACCOUNT_ID --stack weekly-wins-games-pilot --puzzle /absolute/path/to/new-edition.json
```

When people are finished, remove the hosted files and stack:

```sh
node scripts/games-cloud.mjs teardown --profile YOUR_PROFILE --region us-east-1 --account YOUR_ACCOUNT_ID --stack weekly-wins-games-pilot --confirm-delete weekly-wins-games-pilot
```

Teardown verifies the exact stack tag, account, and bucket identity, empties only that stack’s bucket, requests stack deletion, and waits for it to finish. A failed deploy or waiter does not imply teardown succeeded; inspect the stack status before retrying. AWS profiles need the corresponding CloudFormation, S3, and CloudFront permissions. The deploy script does not grant them.

Reference: [AWS CloudFront origin access control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html).
