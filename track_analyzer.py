import pandas as pd
import numpy as np
import boto3
import json
import matplotlib.pyplot as plt
from pandas.api.types import is_numeric_dtype
from sklearn.neighbors import LocalOutlierFactor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

class TrackAnalyzer:

    def __init__(self):
        test = ['danceability', 'energy', 'key', 'loudness', 'mode', 'valence', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'tempo', 'popularity']
        self.features_to_compare = np.random.choice(test, 2)
        self.filename = "aws_secrets.csv"
        self.filepaths = ["album_tracks.json", "liked_tracks.json", "featured_playlist_tracks.json"]

    def get_credentials(self):
        aws_credentials = pd.read_csv(self.filename, header=None).values
        AWS_ACCESS = aws_credentials[0][0].split('=')[1]
        AWS_SECRET = aws_credentials[1][0].split('=')[1]
        AWS_BUCKET = "ee547-final-project"
        return AWS_ACCESS, AWS_SECRET, AWS_BUCKET

    def extract_dataset(self, filepath):
        AWS_ACCESS, AWS_SECRET, AWS_BUCKET = self.get_credentials()
        client = boto3.client('s3', aws_access_key_id=AWS_ACCESS, aws_secret_access_key=AWS_SECRET)
        obj = client.get_object(Bucket=AWS_BUCKET, Key=filepath)['Body'].read().decode('utf-8')
        d = json.loads(obj)
        df = pd.DataFrame.from_dict(d)
        return df

    def create_dataset(self, dfs):
        df = pd.concat(dfs, ignore_index=True)
        df.drop_duplicates(inplace=True)
        scaler = MinMaxScaler()
        scaler.fit(df['popularity'].to_numpy()[:, np.newaxis])
        df['popularity'] = scaler.transform(df['popularity'].to_numpy()[:, np.newaxis])

        feature_df = df[['danceability', 'energy', 'mode', 'valence', 'speechiness', 'acousticness', 'instrumentalness', 'liveness']]
        labels = list(feature_df)
        mean_vals = feature_df.mean().tolist()

        angles = np.linspace(0, 2*np.pi, len(labels), endpoint=False)

        fig = plt.figure(1)
        ax = fig.add_subplot(111, polar=True)
        ax.plot(angles, mean_vals, 'o-', label='Featured Songs', color='blue')
        ax.fill(angles, mean_vals, alpha=0.25, facecolor='blue')
        ax.set_thetagrids(angles*(180/np.pi), labels)

        ax.set_title('Featured Songs Mean Values')
        ax.grid(True)

        plt.legend(loc='best', bbox_to_anchor=(0.1, 0.1))
        plt.savefig('./public/assets/images/mean_values.png')
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
            print('runs')

        return X_train, X_test, train_ids, test_ids

    def compare_features(self, df):
        X_train, X_test, train_ids, test_ids = self.split_data(df)
        lof = LocalOutlierFactor(n_neighbors=20, contamination=0.1, novelty=True).fit(X_train)
        train_pred = lof.predict(X_train)
        test_pred = lof.predict(X_test)
        scores = lof.score_samples(X_test)

        outlier_indices = np.where(test_pred == -1)[0]
        outlier_ids = np.take(test_ids, outlier_indices)
        outlier_scores = np.take(scores, outlier_indices)

        inlier_indices = np.where(test_pred == 1)[0]
        inlier_ids = np.take(test_ids, inlier_indices)

        outlier_tracks = np.zeros((len(outlier_indices), 2))
        for i, track_id in enumerate(outlier_ids):
            outlier_tracks[i] = df[df['ids'].str.match(track_id)][self.features_to_compare].values[0]

        plt.figure(2)
        plt.plot(outlier_tracks[:, 0], outlier_tracks[:, 1], 'bo')

        inlier_tracks = np.zeros((len(inlier_indices), 2))
        for i, track_id in enumerate(inlier_ids):
            inlier_tracks[i] = df[df['ids'].str.match(track_id)][self.features_to_compare].values[0]
        plt.plot(inlier_tracks[:, 0], inlier_tracks[:, 1], 'gx')

        K = 5
        extreme_outlier_indices = sorted(range(len(outlier_scores)), key = lambda sub: outlier_scores[sub])[:K]
        extreme_outlier_ids = np.take(outlier_ids, extreme_outlier_indices)
        extreme_outlier_scores = np.take(outlier_scores, extreme_outlier_indices)

        outlier_point = df[df['ids'].str.match(extreme_outlier_ids.tolist()[0])][self.features_to_compare].values[0]
        plt.plot(outlier_point[0], outlier_point[1], 'rs')
        plt.legend(['Outliers', 'Inliers', 'Extreme Outlier'])
        plt.xlabel(self.features_to_compare[0])
        plt.ylabel(self.features_to_compare[1])
        plt.show()
        plt.title('Outlier Songs')
        plt.savefig('./public/assets/images/outlier_plot.png')

        return extreme_outlier_ids

    def run_analysis_job(self):
        dfs = []
        for filepath in self.filepaths:
            dfs.append(self.extract_dataset(filepath))
        
        updated_df = self.create_dataset(dfs)
        outlier_ids = self.compare_features(updated_df)
        return outlier_ids.to_list()

if __name__=="__main__":
    analysis_job = TrackAnalyzer()
    outliers = analysis_job.run_analysis_job()
    print(outliers)