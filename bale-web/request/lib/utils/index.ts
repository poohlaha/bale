/**
 * @fileOverview Utils
 * @date 2023-12-05
 * @author poohlaha
 */

export default class Utils {
  /**
   * 检验字符串是否为空
   * @param str 要检查的值
   */
  static isBlank(str: string = ''): boolean {
    return str === undefined || str == null || /^[ ]+$/.test(str) || str.length === 0
  }

  /**
   * 判断对象是否为空
   * @param target JSON对象
   */
  static isObjectNull(target: { [K: string]: any } = {}): boolean {
    return !target || JSON.stringify(target) === '{}'
  }
}
