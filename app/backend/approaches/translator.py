import requests

def translate_en_to_ko(text: str) -> str:
	endpoint = "https://api.cognitive.microsofttranslator.com/translate"
	subscription_key = "Cw0rCtYecmy3Zjdne3GzgTzghLDeLuXSD5rrIjLDG4sTwMp3aMyOJQQJ99BJACNns7RXJ3w3AAAbACOGXLYJ"
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
