import React, { useState, useRef } from 'react';
import { Bot, MessageCircle, AlertCircle, Hash, Users, ChevronDown, ChevronRight, Send, X, Image, Paperclip, Loader2 } from 'lucide-react';

interface TelegramUpdate {
	message?: {
		chat: {
			id: number;
			title?: string;
			type: string;
			username?: string;
			first_name?: string;
			last_name?: string;
		};
		message_thread_id?: number;
		is_topic_message?: boolean;
	};
}

interface Topic {
	id: number;
	name: string;
}

interface GroupedUpdates {
	[chatId: string]: {
		chat: TelegramUpdate['message']['chat'];
		topics: Map<number, string>; // Changed to Map to store topic ID -> name
	};
}

interface SendMessageModalProps {
	isOpen: boolean;
	onClose: () => void;
	chatId: number;
	topicId?: number;
	token: string;
	chatName: string;
	topicName?: string;
}

function SendMessageModal({ isOpen, onClose, chatId, topicId, token, chatName, topicName }: SendMessageModalProps) {
	const [message, setMessage] = useState('');
	const [sending, setSending] = useState(false);
	const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	if (!isOpen) return null;

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Check file size (10MB limit for Telegram)
			if (file.size > 10 * 1024 * 1024) {
				setStatus({
				type: 'error',
				message: 'File size must be less than 10MB',
				});
				return;
			}
			setSelectedFile(file);
			setStatus(null);
		}
	};

	const handleSend = async () => {
		if (!message.trim() && !selectedFile) return;

		setSending(true);
		setStatus(null);

		try {
			let response;
			
			if (selectedFile) {
				// Create FormData for file upload
				const formData = new FormData();
				formData.append('chat_id', chatId.toString());
				if (topicId) {
					formData.append('message_thread_id', topicId.toString());
				}
				
				// Determine the method based on file type
				let method = 'sendDocument';
				if (selectedFile.type.startsWith('image/')) {
					method = 'sendPhoto';
					formData.append('photo', selectedFile);
					if (message) formData.append('caption', message);
				} else {
					formData.append('document', selectedFile);
					if (message) formData.append('caption', message);
				}

				response = await fetch(`https://api.telegram.org/bot${token}/${method}`,
					{
						method: 'POST',
						body: formData,
					}
				);
			} else {
				// Send text message
				const params = new URLSearchParams({
					chat_id: chatId.toString(),
					text: message,
					...(topicId && { message_thread_id: topicId.toString() }),
				});

				response = await fetch(`https://api.telegram.org/bot${token}/sendMessage?${params.toString()}`);
			}

			const data = await response.json();

			if (!data.ok) {
				throw new Error(data.description || 'Failed to send message');
			}

			setStatus({ type: 'success', message: 'Message sent successfully!' });
			setMessage('');
			setSelectedFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
			setTimeout(() => {
				onClose();
				setStatus(null);
			}, 1500);
		} catch (err) {
			setStatus({
				type: 'error',
				message: err instanceof Error ? err.message : 'Failed to send message',
			});
		} finally {
			setSending(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
				<div className="p-4 border-b border-gray-200 flex justify-between items-center">
				<h3 className="text-lg font-semibold text-gray-800">
					Send Test Message
				</h3>
				<button
					onClick={onClose}
					className="text-gray-500 hover:text-gray-700"
				>
					<X className="w-5 h-5" />
				</button>
				</div>
				<div className="p-4">
				<div className="mb-4">
					<p className="text-sm text-gray-600">
					Sending to: <span className="font-medium">{chatName}</span>
					{topicName && (
						<> → <span className="font-medium">{topicName}</span></>
					)}
					</p>
					<p className="text-sm text-gray-600">
					Chat ID: <code className="font-mono">{chatId}</code>
					{topicId && (
						<>
						{' '}
						| Topic ID: <code className="font-mono">{topicId}</code>
						</>
					)}
					</p>
				</div>
				
				{/* File Upload Section */}
				<div className="mb-4">
					<div className="flex items-center gap-2 mb-2">
					<input
						type="file"
						ref={fileInputRef}
						onChange={handleFileSelect}
						className="hidden"
						accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
					/>
					<button
						onClick={() => fileInputRef.current?.click()}
						className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
					>
						<Paperclip className="w-4 h-4" />
						Choose File
					</button>
					<button
						onClick={() => fileInputRef.current?.click()}
						className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
					>
						<Image className="w-4 h-4" />
						Choose Image
					</button>
					</div>
					{selectedFile && (
					<div className="text-sm text-gray-600 flex items-center gap-2">
						<Paperclip className="w-4 h-4" />
						{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
						<button
						onClick={() => {
							setSelectedFile(null);
							if (fileInputRef.current) {
							fileInputRef.current.value = '';
							}
						}}
						className="text-red-500 hover:text-red-700"
						>
						<X className="w-4 h-4" />
						</button>
					</div>
					)}
				</div>

				<textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder={selectedFile ? "Add a caption (optional)..." : "Enter your message..."}
					className="w-full h-32 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
				{status && (
					<div
					className={`mt-2 p-2 rounded ${
						status.type === 'success'
						? 'bg-green-50 text-green-700'
						: 'bg-red-50 text-red-700'
					}`}
					>
					{status.message}
					</div>
				)}
				</div>
				<div className="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
				<button
					onClick={onClose}
					className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
				>
					Cancel
				</button>
				<button
					onClick={handleSend}
					disabled={sending || (!message.trim() && !selectedFile)}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
				>
					{sending ? (
					<>
						<Loader2 className="w-4 h-4 animate-spin" />
						Sending...
					</>
					) : (
					<>
						<Send className="w-4 h-4" />
						Send {selectedFile ? 'File' : 'Message'}
					</>
					)}
				</button>
				</div>
			</div>
		</div>
	);
}

function App() {
	const [token, setToken] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [groupedUpdates, setGroupedUpdates] = useState<GroupedUpdates>({});
	const [expandedChats, setExpandedChats] = useState<Set<number>>(new Set());
	const [sendMessageModal, setSendMessageModal] = useState<{
		isOpen: boolean;
		chatId: number;
		topicId?: number;
		chatName: string;
		topicName?: string;
	}>({
		isOpen: false,
		chatId: 0,
		chatName: '',
	});

	const handleGetUpdates = async () => {
		if (!token) {
		setError('Please enter a bot token');
		return;
		}

		setLoading(true);
		setError('');

		try {
		// First get updates to find chats and topics
		const updatesResponse = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
		const updatesData = await updatesResponse.json();

		if (!updatesData.ok) {
			throw new Error(updatesData.description || 'Failed to fetch updates');
		}

		// Group updates by chat ID
		const grouped: GroupedUpdates = {};
		updatesData.result.forEach((update: TelegramUpdate) => {
			console.log('update', update)
			if (!update.message?.chat) return;
			
			const chatId = update.message.chat.id.toString();
			if (!grouped[chatId]) {
				grouped[chatId] = {
					chat: update.message.chat,
					topics: new Map(),
				};
			}
			
			if (update.message.is_topic_message && update.message.message_thread_id) {
				grouped[chatId].topics.set(update.message.message_thread_id, update?.message?.forum_topic_created?.name); // Initialize with empty name
			}
		});

		setGroupedUpdates(grouped);
		if (Object.keys(grouped).length === 0) {
			setError('No recent chats found. Try sending a message to your bot first.');
		}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch updates');
		} finally {
			setLoading(false);
		}
	};

	const getChatName = (chat: TelegramUpdate['message']['chat']) => {
		if (!chat) return '';
		if (chat.title) return chat.title; // For groups
		if (chat.username) return `@${chat.username}`; // For users with username
		return [chat.first_name, chat.last_name].filter(Boolean).join(' '); // For users without username
	};

	const toggleChatExpansion = (chatId: number) => {
		const newExpanded = new Set(expandedChats);
		if (expandedChats.has(chatId)) {
		newExpanded.delete(chatId);
		} else {
		newExpanded.add(chatId);
		}
		setExpandedChats(newExpanded);
	};

	const openSendMessage = (chatId: number, topicId?: number, chatName: string, topicName?: string) => {
		setSendMessageModal({
		isOpen: true,
		chatId,
		topicId,
		chatName,
		topicName,
		});
	};

	return (
		<div className="min-h-screen bg-gray-50">
		<div className="max-w-4xl mx-auto p-6">
			<div className="flex items-center justify-center mb-8">
			<Bot className="w-8 h-8 text-blue-600 mr-2" />
			<h1 className="text-3xl font-bold text-gray-800">Telegram Chat ID Viewer</h1>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
			<div className="mb-4">
				<label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
				Bot Token
				</label>
				<div className="flex gap-4">
				<input
					type="text"
					id="token"
					value={token}
					onChange={(e) => setToken(e.target.value)}
					placeholder="Enter your bot token"
					className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
				/>
				<button
					onClick={handleGetUpdates}
					disabled={loading}
					className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
				>
					{loading ? (
					'Loading...'
					) : (
					<>
						<MessageCircle className="w-4 h-4" />
						Get Chat IDs
					</>
					)}
				</button>
				</div>
			</div>

			{error && (
				<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
				<AlertCircle className="w-5 h-5 text-red-500" />
				<p className="text-red-700">{error}</p>
				</div>
			)}

			{Object.keys(groupedUpdates).length > 0 && (
				<div className="mt-6">
				<h2 className="text-xl font-semibold mb-4">Chat IDs:</h2>
				<div className="space-y-4">
					{Object.entries(groupedUpdates).map(([chatId, { chat, topics }]) => (
					<div
						key={chatId}
						className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
					>
						<div className="p-4 flex justify-between items-start">
						<div 
							className="flex-1 cursor-pointer"
							onClick={() => toggleChatExpansion(chat.id)}
						>
							<div className="flex items-center gap-2">
							{expandedChats.has(chat.id) ? (
								<ChevronDown className="w-4 h-4 text-gray-500" />
							) : (
								<ChevronRight className="w-4 h-4 text-gray-500" />
							)}
							<div>
								<div className="flex items-center gap-2">
								<Users className="w-4 h-4 text-gray-500" />
								<p className="font-medium text-gray-800">
									{getChatName(chat)}
								</p>
								</div>
								<p className="text-sm text-gray-500">Type: {chat.type}</p>
							</div>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<p className="font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
							{chat.id}
							</p>
							<button
							onClick={() => openSendMessage(chat.id, undefined, getChatName(chat))}
							className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
							title="Send test message"
							>
							<Send className="w-4 h-4" />
							</button>
						</div>
						</div>
						
						{expandedChats.has(chat.id) && topics.size > 0 && (
						<div className="border-t border-gray-200">
							<div className="p-4 bg-white">
							<h3 className="text-sm font-medium text-gray-700 mb-2">Topics in this chat:</h3>
							<div className="space-y-2">
								{Array.from(topics.entries()).map(([topicId, topicName]) => (
								<div key={topicId} className="flex items-center justify-between pl-6">
									<div className="flex items-center gap-2">
									<Hash className="w-4 h-4 text-purple-500" />
									<span className="text-sm text-gray-600">
										{topicName || 'Unnamed Topic'}
									</span>
									<code className="font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
										{topicId}
									</code>
									</div>
									<button
									onClick={() => openSendMessage(chat.id, topicId, getChatName(chat), topicName)}
									className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md"
									title="Send test message to topic"
									>
									<Send className="w-4 h-4" />
									</button>
								</div>
								))}
							</div>
							</div>
						</div>
						)}
					</div>
					))}
				</div>
				</div>
			)}
			</div>

			<div className="text-center text-sm text-gray-500">
			<p>To use this tool:</p>
			<ol className="list-decimal list-inside mt-2 space-y-1">
				<li>Create a bot with @BotFather on Telegram</li>
				<li>Copy the bot token and paste it above</li>
				<li>Send a message to your bot (in a group or topic)</li>
				<li>Click "Get Chat IDs" to see the chat information</li>
			</ol>
			<p className="mt-2 text-xs">
				Click on a chat to view its topics (if any) • Click the send icon to test sending messages
			</p>
			</div>
		</div>

		<SendMessageModal
			isOpen={sendMessageModal.isOpen}
			onClose={() => setSendMessageModal({ ...sendMessageModal, isOpen: false })}
			chatId={sendMessageModal.chatId}
			topicId={sendMessageModal.topicId}
			token={token}
			chatName={sendMessageModal.chatName}
			topicName={sendMessageModal.topicName}
		/>
		</div>
	);
}

export default App;