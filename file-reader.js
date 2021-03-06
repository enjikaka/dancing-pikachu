export default function readFileAsArrayBuffer (file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onloadend = event => resolve(event.target.result);
    fileReader.onerror = event => reject(event);

    fileReader.readAsArrayBuffer(file);
  });
}