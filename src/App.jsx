import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ShieldCheck, Wallet, ChevronRight } from 'lucide-react'

import Issuer from './components/Issuer'
import Verifier from './components/Verifier'

// Import artifact and address
import RegistryArtifact from './artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json'
import contractAddress from './contract-address.json';

const CONTRACT_ADDRESS = contractAddress.address;

function App() {
    const [activeTab, setActiveTab] = useState('verifier'); // 'issuer' | 'verifier'
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);

    const connectWallet = async () => {
        if (!window.ethereum) return alert("Please install MetaMask!");
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, signer);

            setAccount(accounts[0]);
            setContract(contract);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (window.ethereum && window.ethereum.selectedAddress) {
            connectWallet();
        }
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center">
            {/* Gradient Background Orbs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

            {/* Sticky Navbar */}
            <nav className="w-full sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
                <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                            <ShieldCheck className="text-white w-7 h-7 relative z-10" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                            Certify<span className="text-primary glow-text">Chain</span>
                        </h1>
                    </div>

                    <button
                        onClick={connectWallet}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${account
                            ? 'bg-success/10 border border-success/20 text-success hover:bg-success/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                            : 'btn-secondary shadow-lg hover:shadow-xl'
                            }`}
                    >
                        <Wallet className="w-4 h-4" />
                        {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
                    </button>
                </div>
            </nav>

            <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col p-6 z-10 mt-8">

                {/* Header Section */}
                <div className="text-center mb-12 animate-fade-in-up">
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-wider uppercase backdrop-blur-sm">
                        Enterprise Grade
                    </div>
                    <h2 className="text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                        {activeTab === 'verifier' ? 'Verify Credentials' : 'Issue Certificates'}
                    </h2>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                        Secure, immutable, and instantly verifiable blockchain-based certification system.
                    </p>
                </div>

                {/* Premium Segmented Control (Tabs) */}
                <div className="flex justify-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="bg-surface/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex relative shadow-2xl">
                        {/* Animated slider background */}
                        <div
                            className={`absolute inset-y-1.5 w-[140px] bg-gradient-to-r ${activeTab === 'verifier' ? 'from-primary to-indigo-600' : 'from-secondary to-fuchsia-600'} rounded-xl transition-all duration-500 ease-spring shadow-lg`}
                            style={{
                                left: activeTab === 'verifier' ? '6px' : 'calc(100% - 146px)',
                                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
                            }}
                        />

                        <button
                            onClick={() => setActiveTab('verifier')}
                            className={`relative px-8 py-3 w-[140px] rounded-xl font-semibold text-sm transition-colors duration-300 z-10 ${activeTab === 'verifier' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Verify
                        </button>
                        <button
                            onClick={() => setActiveTab('issuer')}
                            className={`relative px-8 py-3 w-[140px] rounded-xl font-semibold text-sm transition-colors duration-300 z-10 ${activeTab === 'issuer' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Issue
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        {activeTab === 'verifier' ? (
                            <Verifier contract={contract} />
                        ) : (
                            <Issuer contract={contract} account={account} />
                        )}
                    </motion.div>
                </AnimatePresence>

            </main>

            {/* Footer */}
            <footer className="w-full py-6 text-center text-white/20 text-sm">
                Powered by Ethereum & IPFS
            </footer>
        </div>
    )
}

export default App
