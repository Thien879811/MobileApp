import apiService from "./api.service";
import { API_CONFIG } from "./config";
//http://192.168.101.11:8000/api/promotions/customer

class PromotionService {
    constructor(baseUrl = API_CONFIG.BASE_URL + "/api/promotions") {
        this.api = apiService(baseUrl);
    }

    async getPromotions() {
        return (await this.api.get("/customer")).data;
    }

    async getPromotionDetail(id) {
        return (await this.api.get(`/customer/${id}`)).data;
    }
    
    async create(data) {
        return (await this.api.post("/", data)).data;
    }

    async createVoucher(data) {
        return (await this.api.post("/voucher", data)).data;
    }

    async createRedeemPoint(data) {
        return (await this.api.post("/redeem-point", data)).data;
    }

    async getPromotionByCustomerId(id) {
        return (await this.api.get(`/customer/${id}`)).data;
    }

    async getPromotionCode() {
        return (await this.api.get(`/code`)).data;
    }
}

export default new PromotionService();