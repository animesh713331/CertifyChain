import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Check, Users, FileText, Eye } from 'lucide-react';
import { generateCertificateSVG } from '../utils/CertificateGenerator';
import { uploadFileToIPFS, uploadJSONToIPFS } from '../utils/IPFSClient';

const Issuer = ({ contract, account }) => {
    const [mode, setMode] = useState('single'); // 'single' | 'batch'
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        course: '',
        date: new Date().toISOString().split('T')[0],
        recipient: '',
    });
    const [loading, setLoading] = useState(false);
    const [previewSVG, setPreviewSVG] = useState(null);
    const [status, setStatus] = useState("");

    // Batch State
    const [batchData, setBatchData] = useState([]);
    const [batchFile, setBatchFile] = useState(null);

    useEffect(() => {
        if (formData.name && formData.course) {
            const svg = generateCertificateSVG({
                name: formData.name || "Student Name",
                course: formData.course || "Course Name",
                date: formData.date,
                issuer: "Codec Operations",
                id: formData.id || "ID"
            });
            setPreviewSVG(svg);
        }
    }, [formData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const uploadToPinata = async (data) => {
        // 1. Generate SVG
        const svgString = generateCertificateSVG({
            name: data.name,
            course: data.course,
            date: data.date,
            issuer: "Codec Operations",
            id: data.id
        });

        // 2. SVG to File
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const file = new File([blob], `cert-${data.id}.svg`, { type: 'image/svg+xml' });

        setStatus("Uploading Image to IPFS...");
        const imageHash = await uploadFileToIPFS(file);

        // 3. Create Metadata
        const metadata = {
            name: `Certificate: ${data.course}`,
            description: `Certificate awarded to ${data.name} for completing ${data.course}.`,
            image: `ipfs://${imageHash}`,
            attributes: [
                { trait_type: "Student Name", value: data.name },
                { trait_type: "Course", value: data.course },
                { trait_type: "Date", value: data.date },
                { trait_type: "Issuer", value: "Codec Operations" },
                { trait_type: "ID", value: data.id }
            ]
        };

        setStatus("Uploading Metadata to IPFS...");
        const metadataHash = await uploadJSONToIPFS(metadata);

        return `ipfs://${metadataHash}`;
    };

    const handleIssue = async (e) => {
        e.preventDefault();
        if (!contract || !account) return alert("Connect wallet first!");

        setLoading(true);
        setStatus("Starting...");
        try {
            const uri = await uploadToPinata({
                name: formData.name,
                course: formData.course,
                date: formData.date,
                id: formData.id
            });

            setStatus("Minting on Blockchain...");
            // issueCertificate(to, id, name, course, date, issuerName, uri)
            const tx = await contract.issueCertificate(
                formData.recipient,
                formData.id,
                formData.name,
                formData.course,
                formData.date,
                "Codec Operations",
                uri
            );
            await tx.wait();
            alert("Certificate Issued Successfully!");
            setFormData({ ...formData, id: '', name: '', recipient: '' });
        } catch (error) {
            console.error(error);
            alert("Error: " + (error.message || "Failed to issue"));
        }
        setLoading(false);
        setStatus("");
    };

    const handleBatchUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setBatchFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            // Expected CSV: ID, Name, Course, Date, RecipientAddress
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            // Skip header if present
            const startIdx = lines[0].toLowerCase().startsWith('id') ? 1 : 0;

            const parsed = lines.slice(startIdx).map(line => {
                const cols = line.split(',');
                return {
                    id: cols[0]?.trim(),
                    name: cols[1]?.trim(),
                    course: cols[2]?.trim(),
                    date: cols[3]?.trim(),
                    recipient: cols[4]?.trim()
                };
            });
            setBatchData(parsed);
        };
        reader.readAsText(file);
    };

    const handleBatchIssue = async () => {
        if (!contract || !account) return alert("Connect wallet first!");
        setLoading(true);
        try {
            // Prepare arrays
            const tos = [];
            const ids = [];
            const names = [];
            const courses = [];
            const dates = [];
            const issuers = [];
            const uris = [];

            for (let i = 0; i < batchData.length; i++) {
                const item = batchData[i];
                setStatus(`Processing ${i + 1}/${batchData.length}: Uploading to IPFS...`);

                const uri = await uploadToPinata({
                    name: item.name,
                    course: item.course,
                    date: item.date,
                    id: item.id
                });

                tos.push(item.recipient);
                ids.push(item.id);
                names.push(item.name);
                courses.push(item.course);
                dates.push(item.date);
                issuers.push("Codec Operations");
                uris.push(uri);
            }

            setStatus("Minting Batch...");
            const tx = await contract.batchIssueCertificate(tos, ids, names, courses, dates, issuers, uris);
            await tx.wait();
            alert(`Successfully issued ${batchData.length} certificates!`);
            setBatchData([]);
            setBatchFile(null);
        } catch (error) {
            console.error(error);
            alert("Error: " + (error.message));
        }
        setLoading(false);
        setStatus("");
    };

    return (
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left: Form */}
            <div className="glass-card p-8">
                <div className="flex bg-surfaceHighlight/50 backdrop-blur-md rounded-xl p-1.5 mb-8 border border-white/5">
                    <button
                        onClick={() => setMode('single')}
                        className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${mode === 'single' ? 'bg-gradient-to-r from-primary/80 to-indigo-600/80 text-white shadow-lg border border-white/10' : 'text-gray-400 hover:text-white'}`}
                    >
                        Single Issue
                    </button>
                    <button
                        onClick={() => setMode('batch')}
                        className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${mode === 'batch' ? 'bg-gradient-to-r from-primary/80 to-indigo-600/80 text-white shadow-lg border border-white/10' : 'text-gray-400 hover:text-white'}`}
                    >
                        Batch Issue
                    </button>
                </div>

                {mode === 'single' ? (
                    <form onSubmit={handleIssue} className="space-y-6">
                        <div className="relative group">
                            <input name="recipient" required value={formData.recipient} onChange={handleChange} className="input-field peer" placeholder=" " />
                            <label className="absolute left-4 top-4 text-gray-500 text-sm transition-all duration-300 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-surface peer-focus:px-1 peer-focus:text-primary peer-valid:-top-2.5 peer-valid:left-3 peer-valid:text-xs peer-valid:bg-surface peer-valid:px-1 peer-valid:text-gray-400">
                                Recipient Wallet Address (0x...)
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative group">
                                <input name="id" required value={formData.id} onChange={handleChange} className="input-field peer" placeholder=" " />
                                <label className="absolute left-4 top-4 text-gray-500 text-sm transition-all duration-300 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-surface peer-focus:px-1 peer-focus:text-primary peer-valid:-top-2.5 peer-valid:left-3 peer-valid:text-xs peer-valid:bg-surface peer-valid:px-1 peer-valid:text-gray-400">
                                    Certificate ID
                                </label>
                            </div>
                            <div className="relative group">
                                <input name="name" required value={formData.name} onChange={handleChange} className="input-field peer" placeholder=" " />
                                <label className="absolute left-4 top-4 text-gray-500 text-sm transition-all duration-300 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-surface peer-focus:px-1 peer-focus:text-primary peer-valid:-top-2.5 peer-valid:left-3 peer-valid:text-xs peer-valid:bg-surface peer-valid:px-1 peer-valid:text-gray-400">
                                    Student Name
                                </label>
                            </div>
                        </div>
                        <div className="relative group">
                            <input name="course" required value={formData.course} onChange={handleChange} className="input-field peer" placeholder=" " />
                            <label className="absolute left-4 top-4 text-gray-500 text-sm transition-all duration-300 pointer-events-none peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-surface peer-focus:px-1 peer-focus:text-primary peer-valid:-top-2.5 peer-valid:left-3 peer-valid:text-xs peer-valid:bg-surface peer-valid:px-1 peer-valid:text-gray-400">
                                Course Name
                            </label>
                        </div>

                        <button type="submit" disabled={loading} className="w-full btn-primary mt-6 flex justify-center items-center gap-2 group">
                            {loading ? (
                                <><span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> {status}</>
                            ) : (
                                <>Issue Certificate <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">→</span></>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:bg-white/5 hover:border-primary/50 transition-colors relative cursor-pointer group">
                            <input type="file" accept=".csv" onChange={handleBatchUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                <UploadCloud className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-white font-medium mb-2 text-lg">{batchFile ? batchFile.name : "Drop CSV to Bulk Issue"}</p>
                            <p className="text-gray-400 text-sm">Format: <code className="bg-black/30 px-2 py-1 rounded text-primary">ID, Name, Course, Date, Address</code></p>
                        </div>

                        {batchData.length > 0 && (
                            <div className="bg-surfaceHighlight p-5 rounded-xl max-h-64 overflow-y-auto custom-scrollbar border border-white/5">
                                <p className="text-success text-sm font-semibold mb-3 flex items-center gap-2 pb-2 border-b border-white/5">
                                    <Check className="w-4 h-4" /> Ready to mint {batchData.length} certificates
                                </p>
                                {batchData.map((item, i) => (
                                    <div key={i} className="text-sm text-gray-400 border-b border-white/5 py-2.5 flex justify-between items-center group hover:bg-white/5 px-2 rounded -mx-2">
                                        <span className="font-medium text-gray-200">{item.name}</span>
                                        <span className="font-mono text-xs bg-black/40 px-2 py-1 rounded text-primary/80">{item.id}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleBatchIssue}
                            disabled={batchData.length === 0 || loading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2 mt-4 py-4"
                        >
                            {loading ? (
                                <><span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> {status}</>
                            ) : "Start Batch Minting"}
                        </button>
                    </div>
                )}
            </div>

            {/* Right: Preview */}
            <div className="flex flex-col justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="animated-border rounded-2xl overflow-hidden shadow-2xl bg-surface/50">
                    <div className="bg-black/60 p-4 border-b border-white/5 flex justify-between items-center backdrop-blur-xl relative z-10">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-primary" /> Live Preview
                        </span>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
                        </div>
                    </div>
                    <div className="relative aspect-[4/3] bg-black/40 flex items-center justify-center p-6 relative z-10">
                        {previewSVG ? (
                            <img src={`data:image/svg+xml;utf8,${encodeURIComponent(previewSVG)}`} alt="Certificate Preview" className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-[1.02]" />
                        ) : (
                            <div className="text-center text-gray-500">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30 text-primary" />
                                <p className="text-sm font-medium">Fill details to preview your certificate</p>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-center text-gray-500 text-xs mt-6 font-medium">
                    Secured by Ethereum & Stored Permanently on IPFS
                </p>
            </div>
        </div>
    );
};

export default Issuer;
