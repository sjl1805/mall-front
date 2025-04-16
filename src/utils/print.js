/**
 * 打印功能工具函数
 * 用于支持订单管理和订单详情页面的打印功能
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 打印工具函数，提供对指定 DOM 元素的打印功能
 * @returns {Object} 包含打印相关的引用和方法
 */
export function usePrint() {
  // 要打印的元素引用
  const printRef = ref(null)
  
  /**
   * 打印函数
   * 将指定元素内容打印出来
   */
  const print = () => {
    if (!printRef.value) {
      console.error('打印失败：未找到打印内容')
      return
    }
    
    // 创建打印样式
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-container, .print-container * {
          visibility: visible;
        }
        .print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `
    
    // 添加样式到 head
    document.head.appendChild(style)
    
    // 调用浏览器打印
    window.print()
    
    // 打印完成后移除样式
    setTimeout(() => {
      document.head.removeChild(style)
    }, 100)
  }
  
  /**
   * 打印指定内容
   * @param {HTMLElement} content 要打印的 DOM 元素
   */
  const printElement = (content) => {
    if (!content) return
    
    // 创建打印样式
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        #temp-print-container, #temp-print-container * {
          visibility: visible;
        }
        #temp-print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `
    
    // 创建临时容器
    const tempContainer = document.createElement('div')
    tempContainer.id = 'temp-print-container'
    tempContainer.innerHTML = content.outerHTML
    tempContainer.style.display = 'none'
    
    // 添加到文档
    document.body.appendChild(tempContainer)
    document.head.appendChild(style)
    
    // 延迟打印，确保内容已渲染
    setTimeout(() => {
      tempContainer.style.display = 'block'
      window.print()
      
      // 打印完成后清理
      document.body.removeChild(tempContainer)
      document.head.removeChild(style)
    }, 100)
  }
  
  /**
   * 打印 HTML 字符串
   * @param {string} htmlString 要打印的 HTML 字符串
   * @param {string} title 打印页面标题
   */
  const printHtml = (htmlString, title = '打印') => {
    // 创建打印窗口
    const printWin = window.open('', '_blank', 'width=800,height=600')
    printWin.document.open()
    
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .print-footer {
              text-align: right;
              font-size: 12px;
              color: #999;
              margin-top: 30px;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${htmlString}
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">打印</button>
            <button onclick="window.close()">关闭</button>
          </div>
        </body>
      </html>
    `)
    
    printWin.document.close()
    
    // 确保内容加载完成后自动调用打印
    printWin.onload = () => {
      printWin.focus()
    }
  }
  
  // 监听打印事件来处理特定样式
  const handleBeforePrint = () => {
    // 可以在此添加打印前的准备工作
  }
  
  const handleAfterPrint = () => {
    // 可以在此添加打印后的清理工作
  }
  
  // 组件挂载时添加打印事件监听
  onMounted(() => {
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
  })
  
  // 组件卸载前移除事件监听
  onBeforeUnmount(() => {
    window.removeEventListener('beforeprint', handleBeforePrint)
    window.removeEventListener('afterprint', handleAfterPrint)
  })
  
  return {
    printRef,
    print,
    printElement,
    printHtml
  }
} 