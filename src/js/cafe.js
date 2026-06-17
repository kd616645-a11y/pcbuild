(function(){
	// Modal helpers
	window.openLoginModal = function() {
		const m = document.getElementById('loginModal'); if (m) m.style.display = 'block';
	};

	window.closeLoginModal = function() {
		['loginModal','registerModal','forgotModal'].forEach(id => {
			const el = document.getElementById(id);
			if (el) el.style.display = 'none';
		});
	};

	window.switchToRegister = function() {
		window.closeLoginModal();
		const r = document.getElementById('registerModal'); if (r) r.style.display = 'block';
	};

	window.switchToLogin = function() {
		window.closeLoginModal();
		const l = document.getElementById('loginModal'); if (l) l.style.display = 'block';
	};

	window.switchToForgot = function() {
		window.closeLoginModal();
		const f = document.getElementById('forgotModal'); if (f) f.style.display = 'block';
	};

	window.closeVerifyModal = function() {
		const v = document.getElementById('verifyModal'); if (v) v.style.display = 'none';
	};

	// Đăng ký tài khoản
	window.handleRegister = function(event) {
		if (event && event.preventDefault) event.preventDefault();
		const name = document.getElementById('regName') ? document.getElementById('regName').value.trim() : '';
		const email = document.getElementById('regEmail') ? document.getElementById('regEmail').value.trim() : '';
		const phone = document.getElementById('regPhone') ? document.getElementById('regPhone').value.trim() : '';
		const password = document.getElementById('regPassword') ? document.getElementById('regPassword').value : '';
		const confirm = document.getElementById('regConfirmPassword') ? document.getElementById('regConfirmPassword').value : '';

		if (!email || !password) {
			alert('Vui lòng nhập email và mật khẩu.');
			return;
		}
		if (password !== confirm) {
			alert('Mật khẩu và xác nhận mật khẩu không khớp.');
			return;
		}

		// Sử dụng firebase auth (đã khởi tạo trong cafe.html)
		firebase.auth().createUserWithEmailAndPassword(email, password)
			.then((userCredential) => {
				const user = userCredential.user;
				console.log('Đăng ký thành công!', user);

				// Cập nhật tên hiển thị (nếu có)
				if (name) {
					return user.updateProfile({ displayName: name });
				}
				return Promise.resolve();
			})
			.then(() => {
				alert('Đăng ký thành công! Vui lòng kiểm tra email để xác minh (nếu có).');
				const user = firebase.auth().currentUser;
				if (user && user.sendEmailVerification) {
					user.sendEmailVerification().catch(err => console.error('Gửi email xác minh lỗi:', err));
				}
				// Lưu user vào Firestore (nếu db tồn tại)
				if (typeof db !== 'undefined' && db) {
					db.collection('users').doc(user.uid).set({
						uid: user.uid,
						email: user.email,
						displayName: user.displayName || name || '',
						phone: phone || '',
						createdAt: firebase.firestore.FieldValue.serverTimestamp()
					})
						.catch(err => console.error('Lưu user vào Firestore lỗi:', err));
				}
				window.closeLoginModal();
			})
			.catch((error) => {
				console.error(error.code, error.message);
				alert('Lỗi: ' + error.message);
			});
	};

	// Đăng nhập tài khoản
	window.handleLogin = function(event) {
		if (event && event.preventDefault) event.preventDefault();
		const email = document.getElementById('loginEmail') ? document.getElementById('loginEmail').value.trim() : '';
		const password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value : '';

		if (!email || !password) {
			alert('Vui lòng nhập email và mật khẩu.');
			return;
		}

		firebase.auth().signInWithEmailAndPassword(email, password)
			.then((userCredential) => {
				const user = userCredential.user;
				console.log('Đăng nhập thành công!', user);
				alert('Đăng nhập thành công!');
				// Cập nhật UI
				const acc = document.getElementById('accountNavItem');
				if (acc) acc.innerHTML = `<button class="account-btn" onclick="handleLogout()"><i class="fas fa-user"></i> ${user.displayName || user.email}</button>`;
				// Cập nhật/ghi user vào Firestore
				if (typeof db !== 'undefined' && db) {
					db.collection('users').doc(user.uid).set({
						uid: user.uid,
						email: user.email,
						displayName: user.displayName || '',
						lastLogin: firebase.firestore.FieldValue.serverTimestamp()
					}, { merge: true }).catch(err => console.error('Lưu user vào Firestore lỗi:', err));
				}
				window.closeLoginModal();
			})
			.catch((error) => {
				console.error(error.code, error.message);
				alert('Lỗi: ' + error.message);
			});
	};

	// Đăng xuất
	window.handleLogout = function() {
		firebase.auth().signOut()
			.then(() => {
				alert('Đã đăng xuất.');
				location.reload();
			})
			.catch(err => console.error('Logout error:', err));
	};

	// Alias logout with redirect to login page (keeps existing behavior available)
	window.logout = function() {
		firebase.auth().signOut()
			.then(() => {
				alert('Đã đăng xuất');
				window.location.href = 'login.html';
			})
			.catch(err => {
				console.error('Logout error:', err);
				alert('Lỗi khi đăng xuất: ' + err.message);
			});
	};

	// Quên mật khẩu
	window.handleForgot = function(event) {
		if (event && event.preventDefault) event.preventDefault();
		const ident = document.getElementById('forgotEmail') ? document.getElementById('forgotEmail').value.trim() : '';
		if (!ident) { alert('Vui lòng nhập email đã đăng ký.'); return; }
		firebase.auth().sendPasswordResetEmail(ident)
			.then(() => { alert('Đã gửi hướng dẫn đặt lại mật khẩu đến email.'); window.closeLoginModal(); })
			.catch(err => { console.error(err); alert('Lỗi: ' + err.message); });
	};

	// Gửi lại email xác minh
	window.handleVerify = function(event) {
		if (event && event.preventDefault) event.preventDefault();
		const user = firebase.auth().currentUser;
		if (!user) { alert('Chưa có người dùng đăng nhập.'); return; }
		user.sendEmailVerification()
			.then(() => { alert('Đã gửi email xác minh.'); })
			.catch(err => { console.error(err); alert('Lỗi: ' + err.message); });
	};

	// Lắng nghe trạng thái xác thực để cập nhật UI
	firebase.auth().onAuthStateChanged(async function(user) {
		const acc = document.getElementById('accountNavItem');
		if (user) {
			if (acc) acc.innerHTML = `<button class="account-btn" onclick="handleLogout()"><i class="fas fa-user"></i> ${user.displayName || user.email}</button>`;
			// Cập nhật số dư và giỏ hàng khi có người dùng
			if (typeof updateBalanceDisplay === 'function') {
				try {
					await updateBalanceDisplay();
				} catch (err) {
					console.error('updateBalanceDisplay error:', err);
				}
			}
			if (typeof updateCartCount === 'function') {
				try {
					await updateCartCount();
				} catch (err) {
					console.error('updateCartCount error:', err);
				}
			}
			if (typeof displayCart === 'function') {
				try {
					await displayCart();
				} catch (err) {
					console.error('displayCart error:', err);
				}
			}
			if (typeof showAdminPanel === 'function') {
				try {
					await showAdminPanel();
				} catch (err) {
					console.error('showAdminPanel error:', err);
				}
			}
			if (typeof loadAdminProducts === 'function') {
				try {
					await loadAdminProducts();
				} catch (err) {
					console.error('loadAdminProducts error:', err);
				}
			}
		} else {
			if (acc) acc.innerHTML = `<button class="account-btn" onclick="openLoginModal()"><i class="fas fa-user"></i> Đăng Nhập</button>`;
			const adminPanel = document.getElementById('admin-panel');
			if (adminPanel) adminPanel.style.display = 'none';
		}
	});

	// ====================== ADMIN HELPERS ======================

	window.checkAdminAccess = async function() {
		const user = firebase.auth().currentUser;
		if (!user) return false;

		try {
			const doc = await db.collection('users').doc(user.uid).get();
			const data = doc.data();
			return data && (data.role === 'admin' || data.isAdmin === true);
		} catch (e) {
			console.error('checkAdminAccess error:', e);
			return false;
		}
	};

	window.showAdminPanel = async function() {
		const isAdminUser = await window.checkAdminAccess();
		const panel = document.getElementById('admin-panel');

		if (panel) {
			panel.style.display = isAdminUser ? 'block' : 'none';
		}
		if (isAdminUser) {
			await window.loadAdminProducts();
		}
	};

	window.addNewProduct = async function() {
		const user = firebase.auth().currentUser;
		if (!user) return;

		const product = {
			id: document.getElementById('prod-id').value.trim(),
			name: document.getElementById('prod-name').value.trim(),
			price: parseInt(document.getElementById('prod-price').value, 10),
			image: document.getElementById('prod-image').value.trim(),
			description: document.getElementById('prod-desc').value.trim(),
			createdAt: firebase.firestore.FieldValue.serverTimestamp()
		};

		if (!product.id || !product.name || !product.price) {
			alert('Vui lòng nhập đầy đủ Mã SP, Tên và Giá!');
			return;
		}

		try {
			await db.collection('products').doc(product.id).set(product);
			alert('✅ Thêm sản phẩm thành công!');

			document.getElementById('prod-id').value = '';
			document.getElementById('prod-name').value = '';
			document.getElementById('prod-price').value = '';
			document.getElementById('prod-image').value = '';
			document.getElementById('prod-desc').value = '';

			await window.loadAdminProducts();
		} catch (error) {
			console.error(error);
			alert('Lỗi khi thêm sản phẩm: ' + error.message);
		}
	};

	window.loadAdminProducts = async function() {
		const container = document.getElementById('admin-product-list');
		if (!container) return;

		try {
			const snapshot = await db.collection('products').get();
			container.innerHTML = '';

			if (snapshot.empty) {
				container.innerHTML = '<p>Chưa có sản phẩm nào.</p>';
				return;
			}

			snapshot.forEach(doc => {
				const p = doc.data();
				const div = document.createElement('div');
				div.style = 'border:1px solid #ddd; padding:10px; margin:10px 0; border-radius:8px;';
				div.innerHTML = `
					<strong>${p.name}</strong> - ${Number(p.price).toLocaleString()} VNĐ<br>
					<small>Mã: ${p.id}</small><br>
					<button onclick="deleteProduct('${doc.id}')" style="color:red; margin-top:5px;">Xóa</button>
				`;
				container.appendChild(div);
			});
		} catch (error) {
			console.error(error);
		}
	};

	window.deleteProduct = async function(productId) {
		if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;

		try {
			await db.collection('products').doc(productId).delete();
			alert('Đã xóa sản phẩm');
			await window.loadAdminProducts();
		} catch (error) {
			alert('Lỗi: ' + error.message);
		}
	};

	// ====================== QUẢN LÝ SỐ DƯ ======================

	// Lấy số dư hiện tại
	window.getBalance = async function() {
		const user = firebase.auth().currentUser;
		if (!user) {
			console.warn('getBalance: chưa đăng nhập');
			return 0;
		}

		try {
			const userDoc = await db.collection('users').doc(user.uid).get();
			if (userDoc.exists) {
				const balance = userDoc.data().balance || 0;
				console.log('Số dư:', balance);
				return balance;
			} else {
				// Tạo tài liệu user nếu chưa có
				await db.collection('users').doc(user.uid).set({
					email: user.email,
					displayName: user.displayName || '',
					balance: 0,
					createdAt: firebase.firestore.FieldValue.serverTimestamp()
				});
				return 0;
			}
		} catch (error) {
			console.error('Lỗi lấy số dư:', error);
			return 0;
		}
	};

	// Nạp tiền
	window.topUp = async function(amount) {
		const user = firebase.auth().currentUser;
		if (!user) {
			alert('Bạn chưa đăng nhập!');
			return;
		}

		if (amount <= 0) {
			alert('Số tiền phải lớn hơn 0!');
			return;
		}

		try {
			const userRef = db.collection('users').doc(user.uid);

			await db.runTransaction(async (transaction) => {
				const userDoc = await transaction.get(userRef);
				const currentBalance = userDoc.exists ? (userDoc.data().balance || 0) : 0;

				transaction.set(userRef, {
					balance: currentBalance + parseInt(amount),
					lastTopUp: firebase.firestore.FieldValue.serverTimestamp(),
					email: user.email,
					displayName: user.displayName || ''
				}, { merge: true });
			});

			console.log('✅ Nạp tiền thành công:', amount);
			alert(`Nạp thành công +${parseInt(amount).toLocaleString()} VNĐ`);

			await updateBalanceDisplay();

		} catch (error) {
			console.error('❌ Lỗi nạp tiền:', error.code, error.message);
			alert('Nạp tiền thất bại: ' + error.message);
		}
	};

	// Nạp nhanh
	window.quickTopUp = function(amount) {
		const el = document.getElementById('topup-amount');
		if (el) {
			el.value = amount;
		}
	};

	// Xử lý nút Nạp tiền
	window.handleTopUp = async function() {
		const amountInput = document.getElementById('topup-amount');
		if (!amountInput) { alert('Không tìm thấy ô nhập số tiền (topup-amount)'); return; }
		const amount = parseInt(amountInput.value, 10);

		if (!amount || amount <= 0) {
			alert('Vui lòng nhập số tiền hợp lệ (lớn hơn 0)!');
			amountInput.focus();
			return;
		}

		if (amount < 10000) {
			alert('Số tiền nạp tối thiểu là 10.000 VNĐ');
			return;
		}

		if (amount > 10000000) {
			alert('Số tiền nạp tối đa một lần là 10.000.000 VNĐ');
			return;
		}

		if (confirm(`Bạn có chắc muốn nạp ${amount.toLocaleString()} VNĐ không?`)) {
			await topUp(amount);
			amountInput.value = '';
		}
	};

	// Thêm sản phẩm vào giỏ hàng
	window.addToCart = async function(productOrName, price, image) {
		const user = firebase.auth().currentUser;
		if (!user) {
			alert('Bạn phải đăng nhập để thêm vào giỏ hàng!');
			return;
		}

		let product = productOrName;
		if (typeof productOrName !== 'object' || productOrName === null) {
			const name = String(productOrName || '').trim();
			const amount = Number(price);
			if (!name || !amount || amount <= 0) {
				alert('Thông tin sản phẩm không hợp lệ!');
				return;
			}
			product = {
				id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
				name,
				price: amount,
				image: image || ''
			};
		}

		if (!product || !product.id) {
			alert('Thông tin sản phẩm không hợp lệ!');
			return;
		}

		try {
			const cartRef = db.collection('users').doc(user.uid).collection('cart').doc(product.id);

			await db.runTransaction(async (transaction) => {
				const itemDoc = await transaction.get(cartRef);

				if (itemDoc.exists) {
					const currentQty = itemDoc.data().quantity || 1;
					transaction.update(cartRef, {
						quantity: currentQty + 1,
						updatedAt: firebase.firestore.FieldValue.serverTimestamp()
					});
				} else {
					transaction.set(cartRef, {
						productId: product.id,
						name: product.name,
						price: Number(product.price),
						image: product.image || '',
						quantity: 1,
						addedAt: firebase.firestore.FieldValue.serverTimestamp()
					});
				}
			});

			console.log('✅ Đã thêm vào giỏ:', product.name);
			alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
			if (typeof displayCart === 'function') await displayCart();
			if (typeof updateCartCount === 'function') await updateCartCount();

		} catch (error) {
			console.error('❌ Lỗi thêm giỏ hàng:', error.code, error.message);
			alert('Thêm giỏ hàng thất bại: ' + error.message);
		}
	};

	// Lấy toàn bộ giỏ hàng
	window.getCart = async function() {
		const user = firebase.auth().currentUser;
		if (!user) return [];

		try {
			const snapshot = await db.collection('users')
				.doc(user.uid)
				.collection('cart')
				.orderBy('addedAt', 'desc')
				.get();

			return snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));
		} catch (error) {
			console.error('Lỗi lấy giỏ hàng:', error);
			return [];
		}
	};

	// Hiển thị toàn bộ giỏ hàng
	window.displayCart = async function() {
		const cart = await getCart();
		const container = document.getElementById('cart-items');
		const countEl = document.getElementById('cart-count');
		const totalEl = document.getElementById('cart-total');

		if (!container) return;

		container.innerHTML = '';

		if (!cart || cart.length === 0) {
			container.innerHTML = '<p>Giỏ hàng trống</p>';
			if (countEl) countEl.innerText = 0;
			if (totalEl) totalEl.innerText = 0;
			return;
		}

		let total = 0;

		cart.forEach(item => {
			const itemTotal = (Number(item.price) || 0) * (item.quantity || 1);
			total += itemTotal;

			const div = document.createElement('div');
			div.className = 'cart-item';
			div.innerHTML = `
				<div style="display:flex; justify-content:space-between; align-items:center; margin:10px 0; padding:10px; border:1px solid #ddd; border-radius:8px;">
					<div>
						<strong>${item.name}</strong><br>
						<small>${(Number(item.price)||0).toLocaleString()} × ${item.quantity}</small>
					</div>
					<div style="text-align:right;">
						<strong>${itemTotal.toLocaleString()} VNĐ</strong><br>
						<button onclick="removeFromCart('${item.id}')" style="color:red; font-size:12px;">Xóa</button>
					</div>
				</div>
			`;
			container.appendChild(div);
		});

		if (countEl) countEl.innerText = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
		if (totalEl) totalEl.innerText = total.toLocaleString();
	};

	// Xóa một sản phẩm khỏi giỏ
	window.removeFromCart = async function(productId) {
		const user = firebase.auth().currentUser;
		if (!user) return;

		try {
			await db.collection('users')
				.doc(user.uid)
				.collection('cart')
				.doc(productId)
				.delete();

			alert('Đã xóa sản phẩm khỏi giỏ hàng');
			// Cập nhật hiển thị giỏ và số lượng
			if (typeof displayCart === 'function') await displayCart();
			if (typeof updateCartCount === 'function') await updateCartCount();
		} catch (error) {
			console.error('Lỗi xóa sản phẩm:', error);
		}
	};

	// Xóa toàn bộ giỏ hàng
	window.clearCart = async function() {
		if (!confirm('Xóa toàn bộ giỏ hàng?')) return;
		const user = firebase.auth().currentUser;
		if (!user) return;

		try {
			const cartRef = db.collection('users').doc(user.uid).collection('cart');
			const snapshot = await cartRef.get();

			const batch = db.batch();
			snapshot.docs.forEach(doc => {
				batch.delete(doc.ref);
			});

			await batch.commit();
			alert('Đã xóa toàn bộ giỏ hàng');
			if (typeof displayCart === 'function') await displayCart();
			if (typeof updateCartCount === 'function') await updateCartCount();
		} catch (error) {
			console.error('Lỗi xóa giỏ hàng:', error);
		}
	};

	// Cập nhật số lượng sản phẩm trong giỏ (hiển thị icon giỏ hàng)
	window.updateCartCount = async function() {
		const cart = await getCart();
		const countElement = document.getElementById('cart-count');
		if (countElement) {
			const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
			countElement.innerText = totalItems;
		}
	};

	// Cập nhật số dư (gọi khi load trang hoặc sau khi nạp)
	window.updateBalanceDisplay = async function() {
		const balance = await getBalance();
		const displayElement = document.getElementById('balance-display');
		if (displayElement) {
			displayElement.innerText = Number(balance).toLocaleString();
		}
	};

	// Xác nhận mua: trừ tiền và xóa giỏ hàng trong một giao dịch
	window.handleCheckout = async function() {
		const user = firebase.auth().currentUser;
		if (!user) { alert('Bạn chưa đăng nhập. Vui lòng đăng nhập để mua hàng.'); return; }

		const cart = await getCart();
		if (!cart || cart.length === 0) { alert('Giỏ hàng trống.'); return; }

		const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
		if (!total || total <= 0) { alert('Tổng tiền không hợp lệ.'); return; }

		if (!confirm(`Xác nhận thanh toán ${total.toLocaleString()} VNĐ? Số tiền sẽ được trừ vào số dư.`)) return;

		try {
			const userRef = db.collection('users').doc(user.uid);
			const cartRef = db.collection('users').doc(user.uid).collection('cart');
			const cartSnapshot = await cartRef.get();

			await db.runTransaction(async (transaction) => {
				const userDoc = await transaction.get(userRef);
				const currentBalance = userDoc.exists ? (userDoc.data().balance || 0) : 0;
				if (currentBalance < total) {
					throw new Error('Số dư không đủ để thanh toán.');
				}

				// Trừ tiền
				transaction.update(userRef, {
					balance: currentBalance - total,
					lastPurchase: firebase.firestore.FieldValue.serverTimestamp(),
					lastPurchaseAmount: total
				});

				// Xóa từng sản phẩm trong giỏ
				cartSnapshot.docs.forEach(doc => {
					transaction.delete(doc.ref);
				});
			});

			alert('Thanh toán thành công. Cảm ơn bạn đã mua hàng!');
			if (typeof updateBalanceDisplay === 'function') await updateBalanceDisplay();
			if (typeof displayCart === 'function') await displayCart();
			if (typeof updateCartCount === 'function') await updateCartCount();
		} catch (err) {
			console.error('Checkout error:', err);
			alert('Thanh toán thất bại: ' + (err.message || err));
		}
	};
})();

