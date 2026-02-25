import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

export const uploadFileToIPFS = async (file) => {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        throw new Error("Pinata API keys are missing in .env file");
    }

    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
        name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            maxBodyLength: "Infinity",
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }
        });
        return res.data.IpfsHash;
    } catch (error) {
        console.error("Error uploading file to IPFS: ", error);
        throw error;
    }
};

export const uploadJSONToIPFS = async (jsonData) => {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        throw new Error("Pinata API keys are missing in .env file");
    }

    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    try {
        const res = await axios.post(url, jsonData, {
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }
        });
        return res.data.IpfsHash;
    } catch (error) {
        console.error("Error uploading JSON to IPFS: ", error);
        throw error;
    }
};
