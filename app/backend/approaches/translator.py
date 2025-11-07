import os
import requests

def translate_en_to_ko(text: str) -> str:
	endpoint = "https://api.cognitive.microsofttranslator.com/translate"
	subscription_key = os.getenv("AZURE_TRANSLATOR_KEY")
	if not subscription_key:
		raise RuntimeError(
			"Azure Translator subscription key not set."
			" Please set the AZURE_TRANSLATOR_KEY environment variable."
		)

	location = "koreacentral"

	params = {
		"api-version": "3.0",
		"from": "en",
		"to": ["ko"]
	}
	headers = {
		"Ocp-Apim-Subscription-Key": subscription_key,
		"Ocp-Apim-Subscription-Region": location,
		"Content-type": "application/json"
	}
	body = [{"text": text}]
	response = requests.post(endpoint, params=params, headers=headers, json=body)
	response.raise_for_status()
	result = response.json()
	return result[0]['translations'][0]['text']
