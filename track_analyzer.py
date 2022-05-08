import pandas as pd
import sys
import numpy as np
import boto3
import json
import matplotlib.pyplot as plt
from pandas.api.types import is_numeric_dtype
from sklearn.neighbors import LocalOutlierFactor
from sklearn.model_selection import train_test_split

class TrackAnalyzer:

    def __init__(self, genres, features_to_compare):
        self.genres = genres
        self.features_to_compare = features_to_compare
        self.filename = "rootkey.csv"
        self.filepath = "album_tracks.json"

    def get_credentials(self):
        aws_credentials = pd.read_csv(self.filename, header=None).values
        AWS_ACCESS = aws_credentials[0][0].split('=')[1]
        AWS_SECRET = aws_credentials[1][0].split('=')[1]
        AWS_BUCKET = "ee547-final-project"
        return AWS_ACCESS, AWS_SECRET, AWS_BUCKET

    def extract_dataset(self):
        AWS_ACCESS, AWS_SECRET, AWS_BUCKET = self.get_credentials()
        client = boto3.client('s3', aws_access_key_id=AWS_ACCESS, aws_secret_access_key=AWS_SECRET)
        obj = client.get_object(Bucket=AWS_BUCKET, Key=self.filepath)['Body'].read().decode('utf-8')
        d = json.loads(obj)
        df = pd.DataFrame.from_dict(d)
        return df

    def split_data(self, df):
        X_train, X_test, train_ids, test_ids = None, None, None, None
        try:
            for f in self.features_to_compare:
                if not is_numeric_dtype(df[f]):
                    raise ValueError('Invalid features. Only numeric features are accepted.')

            sub_data = df[self.features_to_compare].to_numpy()
            ids = df["ids"]
            X_train, X_test, train_ids, test_ids = train_test_split(sub_data, ids, test_size=0.2)
        except Exception as e:
            print(str(e))

        return X_train, X_test, train_ids, test_ids

    def compare_features(self, df):
        X_train, X_test, train_ids, test_ids = self.split_data(df, self.features_to_compare)
        lof = LocalOutlierFactor(n_neighbors=20, contamination=0.1, novelty=True).fit(X_train)
        train_pred = lof.predict(X_train)
        test_pred = lof.predict(X_test)
        #score = lof.score_samples(X_test)

        indices = np.where(test_pred == -1)[0]
        outlier_ids = np.take(test_ids, indices)

        return outlier_ids

    def run_analysis_job(self):
        df = self.extract_dataset()
        outlier_ids = self.compare_features(df)
        return {"outlier_ids": outlier_ids.to_list()}

if __name__=="__main__":
    genres = sys.argv[1]
    features_to_compare = sys.argv[2]
    analysis_job = TrackAnalyzer(genres, features_to_compare)
    outliers = analysis_job.run_analysis_job()
    print(outliers)
    sys.stdout.flush()