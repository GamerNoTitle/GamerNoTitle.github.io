
class UnicodeStegApp {
  constructor() {
    this.isLoaded = false
    this.showHidden = false
    this.showSettings = false
    this.defaultChars = "\u200c\u200d\u202c\ufeff"
    this.unicodeSteganographer = undefined 

    this.charSettings = [
      { char: "\u200c", code: "U+200C", name: "零宽非连接符", desc: "阻止字符连接", checked: true },
      { char: "\u200d", code: "U+200D", name: "零宽连接符", desc: "强制字符连接", checked: true },
      { char: "\u202c", code: "U+202C", name: "弹出方向格式", desc: "结束方向格式化", checked: true },
      { char: "\ufeff", code: "U+FEFF", name: "零宽不换行空格", desc: "字节顺序标记字符", checked: true },
      { char: "\u200a", code: "U+200A", name: "细空格", desc: "极细的空格字符", checked: false },
      { char: "\u200b", code: "U+200B", name: "零宽空格", desc: "用于换行的不可见空格", checked: false },
      { char: "\u200e", code: "U+200E", name: "从左到右标记", desc: "文本方向控制", checked: false },
      { char: "\u200f", code: "U+200F", name: "从右到左标记", desc: "文本方向控制", checked: false },
      { char: "\u202a", code: "U+202A", name: "从左到右嵌入", desc: "方向格式化", checked: false },
      { char: "\u202d", code: "U+202D", name: "从左到右覆盖", desc: "强制文本方向", checked: false },
      { char: "\u2062", code: "U+2062", name: "不可见乘号", desc: "数学运算符", checked: false },
      { char: "\u2063", code: "U+2063", name: "不可见分隔符", desc: "数学分隔符", checked: false },
    ]

    this.init()
  }

  init() {
    this.loadSteganographyLibrary()
    this.bindEvents()
    this.updateCharacterCounts()
    this.updateAdvancedSettings()
  }

  loadSteganographyLibrary() {
    
    if (typeof window.unicodeSteganographer !== "undefined") {
      this.unicodeSteganographer = window.unicodeSteganographer
      this.isLoaded = true
    } else {
      setTimeout(() => this.loadSteganographyLibrary(), 100)
    }
  }

  bindEvents() {
    
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.switchTab(e.target.dataset.tab))
    })

    
    const textareas = [
      "original-text",
      "hidden-text",
      "encoded-text",
      "decode-text",
      "decoded-original",
      "decoded-hidden",
    ]
    textareas.forEach((id) => {
      const textarea = document.getElementById(id)
      const counter = document.getElementById(id.replace("-text", "-count"))
      if (textarea && counter) {
        textarea.addEventListener("input", () => {
          counter.textContent = textarea.value.length
        })
      }
    })

    
    document.getElementById("encode-btn").addEventListener("click", () => this.handleEncode())

    
    document.getElementById("decode-btn").addEventListener("click", () => this.handleDecode())

    
    document
      .getElementById("copy-encoded-btn")
      .addEventListener("click", () =>
        this.copyToClipboard(document.getElementById("encoded-text").value, "Encoded text"),
      )
    document
      .getElementById("copy-secret-btn")
      .addEventListener("click", () =>
        this.copyToClipboard(document.getElementById("decoded-hidden").value, "Secret message"),
      )

    
    document
      .getElementById("download-encoded-btn")
      .addEventListener("click", () =>
        this.downloadText(document.getElementById("encoded-text").value, "encoded-message.txt"),
      )
    document
      .getElementById("download-secret-btn")
      .addEventListener("click", () =>
        this.downloadText(document.getElementById("decoded-hidden").value, "secret-message.txt"),
      )

    
    document.getElementById("file-upload").addEventListener("change", (e) => this.handleFileUpload(e))

    
    document.getElementById("toggle-hidden").addEventListener("click", () => this.toggleHiddenVisibility())

    
    document.getElementById("toggle-settings").addEventListener("click", () => this.toggleSettings())

    document.getElementById("reset-chars-btn").addEventListener("click", () => this.resetCharacterSettings())

    document.querySelectorAll(".char-item").forEach((item, index) => {
      item.addEventListener("click", (e) => {
        
        if (e.target.type !== "checkbox") {
          const checkbox = item.querySelector('input[type="checkbox"]')
          checkbox.checked = !checkbox.checked
          this.handleCharToggle(index)
        }
      })

      
      const checkbox = item.querySelector('input[type="checkbox"]')
      checkbox.addEventListener("change", () => this.handleCharToggle(index))
    })
  }

  switchTab(tabName) {
    
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName)
    })

    
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.toggle("active", content.id === `${tabName}-tab`)
    })
  }

  handleEncode() {
    if (!this.isLoaded) {
      this.showToast("错误", "隐写术库未加载", "error")
      return
    }

    const originalText = document.getElementById("original-text").value.trim()
    const hiddenText = document.getElementById("hidden-text").value.trim()

    if (!originalText || !hiddenText) {
      this.showToast("输入缺失", "请提供载体文本和隐藏文本", "error")
      return
    }

    try {
      const result = this.unicodeSteganographer.encodeText(originalText, hiddenText)
      document.getElementById("encoded-text").value = result
      document.getElementById("encoded-count").textContent = result.length
      this.showToast("成功", "文本编码成功，已嵌入隐藏消息", "success")
    } catch (error) {
      this.showToast("编码错误", "文本编码失败", "error")
    }
  }

  handleDecode() {
    if (!this.isLoaded) {
      this.showToast("错误", "隐写术库未加载", "error")
      return
    }

    const encodedText = document.getElementById("decode-text").value.trim()

    if (!encodedText) {
      this.showToast("输入缺失", "请提供要解码的编码文本", "error")
      return
    }

    try {
      const result = this.unicodeSteganographer.decodeText(encodedText)
      document.getElementById("decoded-original").value = result.originalText
      document.getElementById("decoded-hidden").value = result.hiddenText
      document.getElementById("decoded-original-count").textContent = result.originalText.length
      document.getElementById("decoded-hidden-count").textContent = result.hiddenText.length
      this.updateHiddenDisplay()
      this.showToast("成功", "文本解码成功", "success")
    } catch (error) {
      this.showToast("解码错误", "文本解码失败", "error")
    }
  }

  toggleHiddenVisibility() {
    this.showHidden = !this.showHidden
    const toggleBtn = document.getElementById("toggle-hidden")
    toggleBtn.innerHTML = this.showHidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>'
    this.updateHiddenDisplay()
  }

  updateHiddenDisplay() {
    const hiddenTextarea = document.getElementById("decoded-hidden")
    const actualText = hiddenTextarea.dataset.actualValue || hiddenTextarea.value

    if (!this.showHidden && actualText) {
      hiddenTextarea.dataset.actualValue = actualText
      hiddenTextarea.value = "•".repeat(actualText.length)
    } else if (this.showHidden && hiddenTextarea.dataset.actualValue) {
      hiddenTextarea.value = hiddenTextarea.dataset.actualValue
    }
  }

  toggleSettings() {
    this.showSettings = !this.showSettings
    const settingsContent = document.getElementById("settings-content")
    const toggleBtn = document.getElementById("toggle-settings")

    settingsContent.style.display = this.showSettings ? "block" : "none"
    toggleBtn.textContent = this.showSettings ? "隐藏" : "显示"
  }

  handleCharToggle(index) {
    this.charSettings[index].checked = !this.charSettings[index].checked
    this.updateSteganographer()
    this.updateAdvancedSettings()
  }

  updateSteganographer() {
    const selectedChars = this.charSettings
      .filter((char) => char.checked)
      .map((char) => char.char)
      .join("")

    if (selectedChars.length >= 2 && this.unicodeSteganographer) {
      this.unicodeSteganographer.setUseChars(selectedChars)
      this.showToast("设置已更新", `使用 ${selectedChars.length} 个零宽字符进行编码`, "success")
    }
  }

  applyCharacterSettings() {
    const customChars = document.getElementById("custom-chars").value

    if (customChars.length < 2) {
      this.showToast("设置无效", "至少需要2个字符", "error")
      return
    }

    try {
      this.unicodeSteganographer.setUseChars(customChars)
      this.updateEncodingInfo()
      this.showToast("设置已应用", `已更新为使用 ${customChars.length} 个零宽字符`, "success")
    } catch (error) {
      this.showToast("错误", "应用字符设置失败", "error")
    }
  }

  resetCharacterSettings() {
    this.charSettings.forEach((char, index) => {
      char.checked = index < 4 
      const checkbox = document.querySelectorAll('.char-item input[type="checkbox"]')[index]
      if (checkbox) {
        checkbox.checked = char.checked
      }
    })

    this.updateSteganographer()
    this.updateAdvancedSettings()
    this.showToast("重置完成", "已恢复默认零宽字符设置", "success")
  }

  updateAdvancedSettings() {
    const selectedCount = this.charSettings.filter((char) => char.checked).length
    const radix = selectedCount
    const textLength = Math.ceil(Math.log(65536) / Math.log(Math.max(radix, 2)))
    const binaryLength = Math.ceil(Math.log(256) / Math.log(Math.max(radix, 2)))

    
    const selectedCountEl = document.getElementById("selected-count")
    const encodingRadixEl = document.getElementById("encoding-radix")
    if (selectedCountEl) selectedCountEl.textContent = `已选择 ${selectedCount} 个`
    if (encodingRadixEl) encodingRadixEl.textContent = `${radix}进制编码`

    
    const charCountStat = document.getElementById("char-count-stat")
    const radixStat = document.getElementById("radix-stat")
    const textLengthStat = document.getElementById("text-length-stat")
    const binaryLengthStat = document.getElementById("binary-length-stat")

    if (charCountStat) charCountStat.textContent = selectedCount
    if (radixStat) radixStat.textContent = radix
    if (textLengthStat) textLengthStat.textContent = textLength
    if (binaryLengthStat) binaryLengthStat.textContent = binaryLength

    
    const warningEl = document.getElementById("char-warning")
    if (warningEl) {
      warningEl.style.display = selectedCount < 2 ? "block" : "none"
    }

    
    if (selectedCountEl) {
      selectedCountEl.className = selectedCount >= 2 ? "badge badge-primary" : "badge badge-destructive"
    }
  }

  updateEncodingInfo() {
    const customChars = document.getElementById("custom-chars").value
    const charCount = customChars.length

    document.getElementById("chars-count").textContent = charCount
    document.getElementById("set-size").textContent = charCount
    document.getElementById("text-length").textContent = Math.ceil(Math.log(65536) / Math.log(Math.max(charCount, 2)))
    document.getElementById("binary-length").textContent = Math.ceil(Math.log(256) / Math.log(Math.max(charCount, 2)))
    document.getElementById("encoding-base").textContent = `Base-${charCount}`
  }

  async copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text)
      this.showToast("已复制", `${label}已复制到剪贴板`, "success")
    } catch (error) {
      this.showToast("复制失败", "复制到剪贴板失败", "error")
    }
  }

  downloadText(text, filename) {
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    this.showToast("已下载", `文件 ${filename} 下载成功`, "success")
  }

  handleFileUpload(event) {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        document.getElementById("decode-text").value = content
        document.getElementById("decode-count").textContent = content.length
        this.showToast("文件已加载", "文本文件加载成功", "success")
      }
      reader.readAsText(file)
    }
  }

  showToast(title, description, type = "success") {
    const container = document.getElementById("toast-container")
    const toast = document.createElement("div")
    toast.className = `toast ${type}`

    toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-description">${description}</div>
        `

    container.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 4000)
  }

  updateCharacterCounts() {
    
    const textareas = [
      { id: "original-text", counter: "original-count" },
      { id: "hidden-text", counter: "hidden-count" },
      { id: "encoded-text", counter: "encoded-count" },
      { id: "decode-text", counter: "decode-count" },
      { id: "decoded-original", counter: "decoded-original-count" },
      { id: "decoded-hidden", counter: "decoded-hidden-count" },
    ]

    textareas.forEach(({ id, counter }) => {
      const textarea = document.getElementById(id)
      const counterEl = document.getElementById(counter)
      if (textarea && counterEl) {
        counterEl.textContent = textarea.value.length
      }
    })
  }
}


document.addEventListener("DOMContentLoaded", () => {
  new UnicodeStegApp()
})
