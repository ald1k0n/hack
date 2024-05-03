import pandas as pd
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
import re
from joblib import dump

from banned_words import word_list as banned_words


def retrain(new_text_data, new_ban_list = []):
    data_pornographic = None
    with open('text_classifier/pornogrpahic.json', 'r', encoding='utf-8') as f:
        data_pornographic = json.load(f)

    data_harmful = None
    with open('text_classifier/harmful.json', 'r', encoding='utf-8') as f:
        data_harmful = json.load(f)

    data_porn_en = None
    with open('text_classifier/porn.json', 'r', encoding='utf-8') as f:
        data_porn_en = json.load(f)

    # data_sexual_assault = None
    # with open('text_classifier/sexual_assault.json', 'r', encoding='utf-8') as f:
    #     data_sexual_assault = json.load(f)

    data = data_pornographic + data_harmful + data_porn_en

    def contains_banned_words(text):
        text_lower = text.lower()
        for word in banned_words:
            if re.search(word.lower(), text_lower):
                return True
        return False

    text_data = []

    for item in data:
        if 'children' in item['data']:
            for child in item['data']['children']:
                if 'title' in child['data']:
                    text_data.append(child['data']['title'])
                if 'body' in child['data']:
                    text_data.append(child['data']['body'])
                if 'replies' in child['data'] and 'data' in child['data']['replies']:
                    for reply_child in child['data']['replies']['data']['children']:
                        if 'body' in reply_child['data']:
                            text_data.append(reply_child['data']['body'])

    df = pd.DataFrame({"text": text_data})

    df['label'] = df['text'].apply(contains_banned_words).astype(int)
    df['text'] = df['text'].apply(lambda x: re.sub(r'[^\w\s]', '', x))

    tfidf_vectorizer = TfidfVectorizer()
    X = tfidf_vectorizer.fit_transform(df['text'])
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    svm_model = SVC(kernel='linear', class_weight='balanced')
    svm_model.fit(X_train, y_train)


    text_data.extend(new_text_data)
    banned_words.extend(new_ban_list)
    new_df = pd.DataFrame({"text": new_text_data})
    new_df['text'] = new_df['text'].apply(lambda x: re.sub(r'[^\w\s]', '', x))

    new_df['label'] = new_df['text'].apply(contains_banned_words).astype(int)

    df = pd.concat([df, new_df], ignore_index=True)
    
    X = tfidf_vectorizer.fit_transform(df['text'])
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    svm_model.fit(X_train, y_train)

    y_pred = svm_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    for text, label in zip(new_text_data, y_pred):
        print(f"Text: {text}\nClassified as banned: {bool(label)}\n")
        
    dump(svm_model, 'text_classifier.joblib')
    dump(tfidf_vectorizer, 'tfidf_vectorizer.joblib')
    
    return (f"Retrained model accuracy: {accuracy}")

# print(retrain(["Ебучее порно", "адское дрочево", "porn star"], ["Ебучее"]))


# new_text_data = ["child porn", "сексуальное насилие"]

# new_X = tfidf_vectorizer.transform(new_text_data)

# predictions = svm_model.predict(new_X)
# for text, label in zip(new_text_data, predictions):
#     print(f"Text: {text}\nClassified as banned: {bool(label)}\n")