# NiiVue Fullstack Project - Cloud deployment

The deployment is done with Terraform, so you will need it installed. [Official Terraform Install Guide](https://developer.hashicorp.com/terraform/install)


## Environment setup
To deploy to AWS, put your aws credentials in a file called `credentials` in the root directory (file name must be **exact**).

> [!NOTE] Your AWS credentials must be in the following format:

```bash
[default]
aws_access_key_id=...
aws_secret_access_key=...
```

You must also change the following values in `.env` file in the root directory to your WorkOS credentials:

```bash
TF_VAR_workos_client_id=...     # Same value as WORKOS_CLIENT_ID in local deployment
TF_VAR_workos_api_key=...       # Same value as WORKOS_API_KEY in local deployment
```

## Deployment

Run the followings:

```bash
cd infra
terraform init      # only run this on the first time instantiating resources
terraform plan
terraform apply
```

To destroy resource, run:

```bash
terraform destroy
```