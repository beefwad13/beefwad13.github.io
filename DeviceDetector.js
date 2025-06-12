// DeviceDetector class for detecting mobile devices
class DeviceDetector {
    static isMobileDevice() {
        // Check if the device has touch capabilities
        const hasTouchScreen = 'ontouchstart' in window || 
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;
            
        // Check if the User Agent contains mobile identifiers
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // Check if the window width is small
        const isSmallScreen = window.innerWidth <= 800;
        
        // Consider a device mobile if it has touch AND either has a mobile UA OR small screen
        return hasTouchScreen && (isMobileUserAgent || isSmallScreen);
    }
}

if (typeof module !== 'undefined') {
    module.exports = DeviceDetector;
}
