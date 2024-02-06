import fs from 'fs';
import path from 'path';
import axios from 'axios';

const MARKDOWN_PATH = 'script';
const IMAGE_DIR = 'images';
const IMAGE_REGEX = /<img.*?src=['"](\S*?)['"].*>|!\[.*\]\(([^)]+\.\w{1,5})/g;
const IMAGE_SRC_REGEX = /src=['"](\S*?)['"]/;
const IMAGE_MARKDOWN_REGEX = /!\[.*\]\(([^)]+\.\w{1,5})/;

/*
 * URLからファイル名を取得する
 * @param url URL
 *
 * @return ファイル名
 */
function getFileNameFromURL(url) {
  const urlObject = new URL(url);
  return urlObject.pathname.split('/').pop();
}

/*
 * 画像のURLを取得する
 * @param content ファイルの中身
 *
 * @return 画像のURLの配列
 */
function getImageURLs(content) {
  // imgタグを取得
  const imgMatch = content.match(IMAGE_REGEX);

  // imgタグから画像のURLを取得
  const imgSrcMatch = imgMatch?.map((img) => {
    // imgタグから画像のURLを取得
    let src = img.match(IMAGE_SRC_REGEX);
    if (src) return src[1];

    // マークダウンの画像挿入を取得
    src = img.match(IMAGE_MARKDOWN_REGEX);
    if (src) return src[1];

    // 画像のURLが見つからない場合はエラーを返す
    throw new Error(`No image match.\n${img}`);
  });

  return imgSrcMatch?.filter((img) => img.startsWith('http')) ?? [];
}

/*
 * 画像を保存する
 * @param url 画像のURL
 * @param fileId ファイルのID
 */
async function saveImage(url) {
  axios
    .get(url, { responseType: 'arraybuffer' })
    .then((res) => {
      // 画像のファイル名を取得
      const fileName = getFileNameFromURL(url);
      // 画像を保存するディレクトリのパスを取得
      const dirPath = path.join(IMAGE_DIR);

      // dirPath が存在しない場合は作成する
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

      // 画像を保存
      const filePath = path.join(dirPath, fileName);
      fs.writeFileSync(filePath, res.data, 'binary');
    })
    .catch(() => null);
}

function main() {
  const files = fs.readdirSync(MARKDOWN_PATH);

  files
    .filter((file) => file.endsWith('.md'))
    .forEach((fileName) => {
      // ファイルパスを取得
      const filePath = path.join(MARKDOWN_PATH, fileName);
      // ファイルの中身を取得
      const content = fs.readFileSync(filePath, 'utf8');
      // 画像を保存して、画像のURLを置換したファイルの中身を取得
      const imageUrls = getImageURLs(content);
      // 画像を保存
      imageUrls.forEach((imageUrl) => void saveImage(imageUrl));
    });
}

main();
