import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import shortid from 'shortid';

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY as string,
    secretAccessKey: process.env.S3_SECRET_KEY as string
  },
  region: 'ap-northeast-2'
});

const upload = (path: string) =>
  multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.S3_BUCKET_NAME as string,
      acl: 'public-read-write',
      key: (req, file, cb) => {
        const fileId = shortid.generate();
        const type = file.mimetype.split('/')[1];
        const filePath = `${path}/${Date.now()}_${fileId}.${type}`;
        cb(null, filePath);
      }
    })
  });

const storyUpload = upload('story');
const tipUpload = upload('tip');
const userUpload = upload('user');

export { storyUpload, tipUpload, userUpload };
